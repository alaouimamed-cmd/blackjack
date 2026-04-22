/**
 * Service de gestion des factures conforme à la législation marocaine
 * 
 * Fonctionnalités:
 * - Numérotation séquentielle immuable (CGI)
 * - Validation transactionnelle
 * - Gestion du stock
 * - Immutabilité après validation
 * - Journal d'audit (loi 09-08)
 */

import { PrismaClient, InvoiceType, InvoiceStatus } from '@prisma/client';
import {
  calculateInvoiceTotals,
  formatInvoiceNumber,
  validateLegalMentions,
} from '../lib/fiscal/tax-calculator';

const prisma = new PrismaClient();

export interface CreateInvoiceInput {
  companyId: string;
  clientId: string;
  type: InvoiceType;
  items: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPriceHT: number;
    tvaRate: number;
    discountPercent?: number;
    discountAmount?: number;
  }>;
  paymentMethod?: string;
  paymentTerms?: string;
  notes?: string;
  dueDate?: Date;
}

export interface ValidateInvoiceResult {
  success: boolean;
  invoiceNumber?: string;
  error?: string;
}

/**
 * Crée une nouvelle facture avec numérotation automatique
 * Utilise une transaction pour garantir l'intégrité de la séquence
 */
export async function createInvoice(
  input: CreateInvoiceInput,
  userId: string
): Promise<ValidateInvoiceResult> {
  const {
    companyId,
    clientId,
    type,
    items,
    paymentMethod = 'virement',
    paymentTerms,
    notes,
    dueDate,
  } = input;

  try {
    // Vérifier que le client existe
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return { success: false, error: 'Client non trouvé' };
    }

    // Récupérer l'entreprise pour préfixe et séquence
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: { tenant: true },
    });

    if (!company) {
      return { success: false, error: 'Entreprise non trouvée' };
    }

    // Déterminer le préfixe selon le type
    let prefix = company.invoicePrefix;
    if (type === InvoiceType.QUOTE) {
      prefix = company.quotePrefix;
    } else if (type === InvoiceType.CREDIT_NOTE) {
      prefix = company.creditNotePrefix;
    } else if (type === InvoiceType.DELIVERY) {
      prefix = company.deliveryPrefix;
    }

    // Transaction pour numérotation atomique
    const result = await prisma.$transaction(async (tx) => {
      // Générer le numéro de facture
      const currentYear = new Date().getFullYear();
      
      // Mettre à jour la séquence si on change d'année
      let sequence = company.invoiceSequence;
      let year = company.currentYear;
      
      if (year !== currentYear) {
        // Nouvelle année, on reset la séquence
        sequence = 1;
        year = currentYear;
        
        await tx.company.update({
          where: { id: companyId },
          data: {
            currentYear: year,
            invoiceSequence: 1,
          },
        });
      } else {
        // Incrémenter la séquence
        await tx.company.update({
          where: { id: companyId },
          data: {
            invoiceSequence: sequence + 1,
          },
        });
      }

      const invoiceNumber = formatInvoiceNumber(prefix, year, sequence);

      // Calculer les totaux
      const totals = calculateInvoiceTotals(items, 0, paymentMethod);

      // Créer la facture
      const invoice = await tx.invoice.create({
        data: {
          companyId,
          number: invoiceNumber,
          type,
          status: InvoiceStatus.DRAFT,
          clientId,
          issueDate: new Date(),
          dueDate,
          paymentMethod,
          paymentTerms,
          notes,
          
          // Totaux
          subtotalHT: totals.subtotalHT,
          discountAmount: totals.discountAmount,
          totalHT: totals.totalHT,
          totalTVA: totals.totalTVA,
          timbreFiscal: totals.timbreFiscal,
          totalTTC: totals.totalTTC,
          
          remainingAmount: totals.totalTTC,
          
          // Lignes
          items: {
            create: items.map((item, index) => {
              const lineTotalHT = item.quantity * item.unitPriceHT;
              const lineDiscount = item.discountAmount || 
                (lineTotalHT * ((item.discountPercent || 0) / 100));
              const netHT = lineTotalHT - lineDiscount;
              const tvaAmount = netHT * (item.tvaRate / 100);
              
              return {
                productId: item.productId,
                description: item.description,
                quantity: item.quantity,
                unitPriceHT: item.unitPriceHT,
                tvaRate: item.tvaRate,
                discountPercent: item.discountPercent || 0,
                discountAmount: lineDiscount,
                totalHT: netHT,
                tvaAmount,
                totalTTC: netHT + tvaAmount,
                sortOrder: index,
              };
            }),
          },
        },
        include: {
          items: true,
          client: true,
        },
      });

      // Journal d'audit (loi 09-08)
      await tx.auditLog.create({
        data: {
          tenantId: company.tenantId,
          userId,
          action: 'CREATE',
          entityType: 'Invoice',
          entityId: invoice.id,
          newValue: {
            number: invoiceNumber,
            type,
            clientId,
            totalTTC: totals.totalTTC,
          },
        },
      });

      return invoice;
    });

    return {
      success: true,
      invoiceNumber: result.number,
    };
  } catch (error) {
    console.error('Erreur création facture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Valide une facture (la rend immuable)
 * Une fois validée, une facture ne peut plus être modifiée
 * Seul un avoir peut annuler ses effets
 */
export async function validateInvoice(
  invoiceId: string,
  userId: string
): Promise<ValidateInvoiceResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          company: true,
          client: true,
          items: true,
        },
      });

      if (!invoice) {
        throw new Error('Facture non trouvée');
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new Error('Facture déjà annulée');
      }

      if (invoice.validatedAt) {
        throw new Error('Facture déjà validée');
      }

      // Vérifier les mentions légales obligatoires
      const legalValidation = validateLegalMentions({
        ice: invoice.company.ice,
        pat: invoice.company.pat,
        mf: invoice.company.mf,
        rc: invoice.company.rc,
        if: invoice.company.if,
        legalForm: invoice.company.legalForm,
      });

      if (!legalValidation.valid) {
        throw new Error(
          `Mentions légales incomplètes: ${legalValidation.errors.join(', ')}`
        );
      }

      // Vérifier que le client a les infos requises
      if (invoice.client.type === 'entreprise') {
        if (!invoice.client.ice) {
          throw new Error('ICE client obligatoire pour les entreprises');
        }
      }

      // Marquer comme validée
      const validatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.SENT,
          validatedAt: new Date(),
          validatedBy: userId,
        },
      });

      // Décrémenter le stock si c'est une facture (pas un devis)
      if (invoice.type === InvoiceType.INVOICE) {
        for (const item of invoice.items) {
          if (item.productId) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
            });

            if (product && product.trackStock) {
              const newQty = product.stockQuantity - item.quantity;

              if (newQty < 0 && !product.allowNegative) {
                throw new Error(
                  `Stock insuffisant pour ${product.name}: ${product.stockQuantity} < ${item.quantity}`
                );
              }

              // Mettre à jour le stock
              await tx.product.update({
                where: { id: item.productId },
                data: { stockQuantity: newQty },
              });

              // Journaliser le mouvement de stock
              await tx.stockMovement.create({
                data: {
                  companyId: invoice.companyId,
                  productId: item.productId,
                  type: 'sortie',
                  quantity: -item.quantity,
                  reason: `Facture ${invoice.number}`,
                  referenceType: 'invoice',
                  referenceId: invoice.id,
                  previousQty: product.stockQuantity,
                  newQty,
                  userId,
                },
              });
            }
          }
        }
      }

      // Journal d'audit
      await tx.auditLog.create({
        data: {
          tenantId: invoice.company.tenantId,
          userId,
          action: 'VALIDATE',
          entityType: 'Invoice',
          entityId: invoiceId,
          newValue: {
            status: 'SENT',
            validatedAt: new Date(),
          },
        },
      });

      return validatedInvoice;
    });

    return {
      success: true,
      invoiceNumber: result.number,
    };
  } catch (error) {
    console.error('Erreur validation facture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Crée un avoir (note de crédit) lié à une facture originale
 * Numérotation distincte obligatoire
 */
export async function createCreditNote(
  originalInvoiceId: string,
  userId: string,
  reason: string
): Promise<ValidateInvoiceResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const originalInvoice = await tx.invoice.findUnique({
        where: { id: originalInvoiceId },
        include: {
          company: true,
          client: true,
          items: true,
        },
      });

      if (!originalInvoice) {
        throw new Error('Facture originale non trouvée');
      }

      if (originalInvoice.type === InvoiceType.CREDIT_NOTE) {
        throw new Error('Cannot create credit note for another credit note');
      }

      // Générer numéro d'avoir
      const currentYear = new Date().getFullYear();
      const prefix = originalInvoice.company.creditNotePrefix;
      
      // Incrémenter séquence avoirs
      await tx.company.update({
        where: { id: originalInvoice.companyId },
        data: {
          invoiceSequence: originalInvoice.company.invoiceSequence + 1,
        },
      });

      const creditNoteNumber = formatInvoiceNumber(
        prefix,
        currentYear,
        originalInvoice.company.invoiceSequence
      );

      // Créer l'avoir avec mêmes lignes mais montants négatifs
      const creditNote = await tx.invoice.create({
        data: {
          companyId: originalInvoice.companyId,
          number: creditNoteNumber,
          type: InvoiceType.CREDIT_NOTE,
          status: InvoiceStatus.DRAFT,
          clientId: originalInvoice.clientId,
          originalInvoiceId: originalInvoice.id,
          issueDate: new Date(),
          paymentMethod: originalInvoice.paymentMethod,
          notes: `Avoir pour facture ${originalInvoice.number}: ${reason}`,
          
          // Montants inversés (négatifs)
          subtotalHT: -originalInvoice.subtotalHT,
          discountAmount: -originalInvoice.discountAmount,
          totalHT: -originalInvoice.totalHT,
          totalTVA: -originalInvoice.totalTVA,
          timbreFiscal: 0, // Pas de timbre pour les avoirs
          totalTTC: -originalInvoice.totalTTC,
          
          remainingAmount: -originalInvoice.remainingAmount,
          
          // Recréer les lignes avec quantités négatives
          items: {
            create: originalInvoice.items.map((item, index) => ({
              productId: item.productId,
              description: item.description,
              quantity: -item.quantity, // Négatif pour avoir
              unitPriceHT: item.unitPriceHT,
              tvaRate: item.tvaRate,
              discountPercent: item.discountPercent,
              discountAmount: -item.discountAmount,
              totalHT: -item.totalHT,
              tvaAmount: -item.tvaAmount,
              totalTTC: -item.totalTTC,
              sortOrder: index,
            })),
          },
        },
      });

      // Journal d'audit
      await tx.auditLog.create({
        data: {
          tenantId: originalInvoice.company.tenantId,
          userId,
          action: 'CREATE',
          entityType: 'Invoice',
          entityId: creditNote.id,
          newValue: {
            type: 'CREDIT_NOTE',
            originalInvoiceId,
            reason,
          },
        },
      });

      return creditNote;
    });

    return {
      success: true,
      invoiceNumber: result.number,
    };
  } catch (error) {
    console.error('Erreur création avoir:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}

/**
 * Enregistre un paiement sur une facture
 */
export async function recordPayment(
  invoiceId: string,
  amount: number,
  method: string,
  reference?: string,
  bankName?: string,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
        include: { company: true },
      });

      if (!invoice) {
        throw new Error('Facture non trouvée');
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        throw new Error('Facture annulée');
      }

      // Créer le paiement
      await tx.payment.create({
        data: {
          invoiceId,
          amount,
          method,
          reference,
          bankName,
        },
      });

      // Mettre à jour les montants
      const newAmountPaid = invoice.amountPaid + amount;
      const newRemaining = Math.max(0, invoice.remainingAmount - amount);

      let newStatus = invoice.status;
      if (newRemaining === 0) {
        newStatus = InvoiceStatus.PAID;
      } else if (newAmountPaid > 0) {
        newStatus = InvoiceStatus.PARTIAL;
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          remainingAmount: newRemaining,
          status: newStatus,
        },
      });

      // Journal d'audit
      if (userId) {
        await tx.auditLog.create({
          data: {
            tenantId: invoice.company.tenantId,
            userId,
            action: 'PAYMENT',
            entityType: 'Invoice',
            entityId: invoiceId,
            newValue: {
              amount,
              method,
              remainingAmount: newRemaining,
            },
          },
        });
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur enregistrement paiement:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
}
