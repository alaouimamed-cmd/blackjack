/**
 * 🇲🇦 Service de Gestion des Documents Commerciaux
 * Conformité : CGI, DGI, CNDP (Loi 09-08), PCG Maroc
 * 
 * Cycle complet : Devis → Commande → BL → Facture → Avoir
 */

import { createHash } from 'crypto';
import { PrismaClient, DocumentType, DocumentStatus, VatRate } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// CONSTANTES & CONFIGURATION
// ============================================================================

const DOCUMENT_PREFIXES: Record<DocumentType, string> = {
  QUOTATION: 'DEV',
  ORDER: 'CMD',
  DELIVERY: 'BL',
  INVOICE: 'FAC',
  CREDIT_NOTE: 'AVO',
};

const VAT_PERCENTAGES: Record<VatRate, number> = {
  EXEMPT: 0,
  REDUCED_1: 10,
  REDUCED_2: 14,
  STANDARD: 20,
  SUSPENDED: 0,
};

// ============================================================================
// TYPES
// ============================================================================

interface CreateDocumentDTO {
  type: DocumentType;
  customerId: string;
  sellerCompanyId: string;
  lines: CreateDocumentLineDTO[];
  paymentTerms?: string;
  notes?: string;
  discountPercent?: number;
  shippingCost?: number;
}

interface CreateDocumentLineDTO {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  vatRate: VatRate;
}

interface DocumentCalculations {
  subtotal: number;
  discountAmount: number;
  taxableBase: number;
  vatDetails: Record<string, { base: number; amount: number }>;
  vatAmount: number;
  total: number;
}

// ============================================================================
// SERVICE PRINCIPAL
// ============================================================================

export class DocumentService {
  
  /**
   * Génère un numéro de document inviolable
   * Format : PREFIX-YYYY-NNNNNN (ex: FAC-2025-000001)
   */
  private async generateDocumentNumber(type: DocumentType): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = DOCUMENT_PREFIXES[type];
    
    // Transaction atomique pour éviter les conflits
    const result = await prisma.$transaction(async (tx) => {
      // Récupérer le dernier numéro
      const lastDoc = await tx.document.findFirst({
        where: {
          type,
          number: {
            startsWith: `${prefix}-${year}-`
          }
        },
        orderBy: { number: 'desc' },
        select: { number: true }
      });
      
      let sequence = 1;
      if (lastDoc) {
        const parts = lastDoc.number.split('-');
        const lastSequence = parseInt(parts[2], 10);
        sequence = lastSequence + 1;
      }
      
      return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
    });
    
    return result;
  }
  
  /**
   * Calcule les totaux d'un document conformément au CGI
   */
  private calculateTotals(lines: CreateDocumentLineDTO[], discountPercent?: number, shippingCost?: number): DocumentCalculations {
    // Calcul du subtotal
    const subtotal = lines.reduce((sum, line) => {
      const lineDiscount = line.discountPercent || 0;
      return sum + (line.quantity * line.unitPrice * (1 - lineDiscount / 100));
    }, 0);
    
    // Remise globale
    const discountAmount = discountPercent ? subtotal * (discountPercent / 100) : 0;
    
    // Base imposable après remise globale
    const taxableBase = subtotal - discountAmount;
    
    // Détails TVA par taux
    const vatDetails: Record<string, { base: number; amount: number }> = {};
    let vatAmount = 0;
    
    lines.forEach(line => {
      const rateKey = `${VAT_PERCENTAGES[line.vatRate]}%`;
      const lineBase = line.quantity * line.unitPrice * (1 - (line.discountPercent || 0) / 100);
      const proportionalBase = lineBase * (taxableBase / subtotal); // Répartition proportionnelle de la remise
      
      if (!vatDetails[rateKey]) {
        vatDetails[rateKey] = { base: 0, amount: 0 };
      }
      
      vatDetails[rateKey].base += proportionalBase;
      vatDetails[rateKey].amount += proportionalBase * (VAT_PERCENTAGES[line.vatRate] / 100);
    });
    
    // Arrondis conformes (2 décimales)
    Object.keys(vatDetails).forEach(rate => {
      vatDetails[rate].base = Math.round(vatDetails[rate].base * 100) / 100;
      vatDetails[rate].amount = Math.round(vatDetails[rate].amount * 100) / 100;
      vatAmount += vatDetails[rate].amount;
    });
    
    // Total TTC
    const total = taxableBase + vatAmount + (shippingCost || 0);
    
    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxableBase: Math.round(taxableBase * 100) / 100,
      vatDetails,
      vatAmount: Math.round(vatAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }
  
  /**
   * Génère le hash SHA-256 pour l'intégrité du document (anti-falsification DGI)
   */
  private generateDocumentHash(documentData: any, previousHash?: string): string {
    const content = JSON.stringify({
      ...documentData,
      previousHash: previousHash || null,
      timestamp: new Date().toISOString(),
    });
    
    return createHash('sha256').update(content).digest('hex');
  }
  
  /**
   * Crée un nouveau document commercial avec traçabilité complète
   */
  async createDocument(dto: CreateDocumentDTO, userId: string, ipAddress?: string) {
    return await prisma.$transaction(async (tx) => {
      // 1. Générer le numéro inviolable
      const number = await this.generateDocumentNumber(dto.type);
      
      // 2. Calculer les totaux
      const calculations = this.calculateTotals(
        dto.lines, 
        dto.discountPercent, 
        dto.shippingCost
      );
      
      // 3. Récupérer le hash du document précédent (chaîne cryptographique)
      const previousDoc = await tx.document.findFirst({
        where: { type: dto.type },
        orderBy: { createdAt: 'desc' },
        select: { hash: true }
      });
      
      // 4. Préparer les données pour le hash
      const hashData = {
        number,
        type: dto.type,
        customerId: dto.customerId,
        sellerCompanyId: dto.sellerCompanyId,
        issueDate: new Date().toISOString(),
        lines: dto.lines,
        totals: calculations,
      };
      
      // 5. Générer le hash
      const hash = this.generateDocumentHash(hashData, previousDoc?.hash);
      
      // 6. Créer le document
      const document = await tx.document.create({
        data: {
          number,
          type: dto.type,
          status: DocumentStatus.DRAFT,
          issueDate: new Date(),
          sellerCompanyId: dto.sellerCompanyId,
          customerId: dto.customerId,
          currency: 'MAD',
          exchangeRate: 1,
          subtotal: calculations.subtotal,
          discountAmount: calculations.discountAmount,
          taxableBase: calculations.taxableBase,
          vatAmount: calculations.vatAmount,
          total: calculations.total,
          vatDetails: calculations.vatDetails as any,
          discountPercent: dto.discountPercent || null,
          shippingCost: dto.shippingCost || 0,
          paymentTerms: dto.paymentTerms,
          notes: dto.notes,
          hash,
          previousHash: previousDoc?.hash || null,
          footer: this.getLegalFooter(dto.sellerCompanyId),
        },
        include: {
          customer: true,
          seller: true,
        },
      });
      
      // 7. Créer les lignes du document
      for (let i = 0; i < dto.lines.length; i++) {
        const line = dto.lines[i];
        const lineDiscount = line.discountPercent || 0;
        const lineBase = line.quantity * line.unitPrice * (1 - lineDiscount / 100);
        const vatPercentage = VAT_PERCENTAGES[line.vatRate];
        const lineVAT = lineBase * (vatPercentage / 100);
        
        await tx.documentLine.create({
          data: {
            documentId: document.id,
            lineNumber: i + 1,
            productId: line.productId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discountPercent: lineDiscount,
            discountAmount: lineBase * (lineDiscount / 100),
            vatRate: line.vatRate,
            vatAmount: lineVAT,
            lineTotal: lineBase,
            lineTotalTTC: lineBase + lineVAT,
            // Récupérer les infos produit pour archivage
            productName: '', // Sera rempli par JOIN
            productSku: '', // Sera rempli par JOIN
            unit: 'PIECE',
          },
        });
      }
      
      // 8. Journal d'audit (CNDP + DGI)
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'DOCUMENT',
          entityId: document.id,
          userId,
          ipAddress: ipAddress || null,
          after: {
            number: document.number,
            type: document.type,
            total: document.total,
          },
        },
      });
      
      return document;
    });
  }
  
  /**
   * Valide et signe un document (le rend inmodifiable)
   */
  async signDocument(documentId: string, userId: string, ipAddress?: string) {
    return await prisma.$transaction(async (tx) => {
      const document = await tx.document.findUnique({
        where: { id: documentId },
        include: { lines: true },
      });
      
      if (!document) {
        throw new Error('Document non trouvé');
      }
      
      if (document.status !== DocumentStatus.DRAFT) {
        throw new Error('Seul un document en brouillon peut être signé');
      }
      
      // Vérifier que le document a au moins une ligne
      if (document.lines.length === 0) {
        throw new Error('Un document doit avoir au moins une ligne');
      }
      
      // Régénérer le hash avec le contenu final
      const hashData = {
        number: document.number,
        type: document.type,
        customerId: document.customerId,
        sellerCompanyId: document.sellerCompanyId,
        issueDate: document.issueDate.toISOString(),
        lines: document.lines.map(l => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          vatRate: l.vatRate,
          lineTotal: l.lineTotal,
        })),
        totals: {
          subtotal: document.subtotal,
          discountAmount: document.discountAmount,
          taxableBase: document.taxableBase,
          vatAmount: document.vatAmount,
          total: document.total,
        },
      };
      
      const newHash = this.generateDocumentHash(hashData, document.previousHash);
      
      // Mettre à jour le document
      const updated = await tx.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.SENT,
          hash: newHash,
          signedAt: new Date(),
          signedBy: userId,
        },
      });
      
      // Audit
      await tx.auditLog.create({
        data: {
          action: 'SIGN',
          entityType: 'DOCUMENT',
          entityId: documentId,
          userId,
          ipAddress: ipAddress || null,
          after: { hash: newHash, signedAt: new Date() },
        },
      });
      
      // Si c'est un BL ou une facture, impacter le stock
      if (document.type === 'DELIVERY' || document.type === 'INVOICE') {
        await this.impactStockOnDocument(tx, document, 'EXIT');
      }
      
      return updated;
    });
  }
  
  /**
   * Impacte le stock lors de la validation d'un document
   */
  private async impactStockOnDocument(
    tx: any,
    document: any,
    movementType: 'ENTRY' | 'EXIT' | 'RETURN'
  ) {
    for (const line of document.lines) {
      if (!line.productId) continue;
      
      const quantity = parseInt(line.quantity.toString(), 10);
      const unitCost = parseFloat(line.unitPrice.toString());
      
      // Créer le mouvement de stock
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          type: movementType,
          quantity: movementType === 'EXIT' ? -quantity : quantity,
          unitCost,
          totalValue: quantity * unitCost,
          reference: document.number,
          performedBy: document.signedBy || 'SYSTEM',
        },
      });
      
      // Mettre à jour le stock actuel
      const product = await tx.product.findUnique({
        where: { id: line.productId },
      });
      
      if (product) {
        const newStock = movementType === 'EXIT' 
          ? product.currentStock - quantity
          : product.currentStock + quantity;
        
        // Recalculer le CMUP si entrée de stock
        let newAverageCost = product.averageCost;
        if (movementType === 'ENTRY' || movementType === 'RETURN') {
          const totalValue = (product.currentStock * parseFloat(product.averageCost.toString())) + (quantity * unitCost);
          const totalQuantity = product.currentStock + quantity;
          newAverageCost = totalValue / totalQuantity;
        }
        
        await tx.product.update({
          where: { id: line.productId },
          data: {
            currentStock: newStock,
            averageCost: newAverageCost,
          },
        });
      }
      
      // Mettre à jour la ligne pour tracer l'impact stock
      await tx.documentLine.update({
        where: { id: line.id },
        data: {
          stockImpacted: true,
          stockQuantity: movementType === 'EXIT' ? -quantity : quantity,
        },
      });
    }
  }
  
  /**
   * Crée un avoir (note de crédit) qui réintègre le stock
   */
  async createCreditNote(originalDocumentId: string, userId: string, ipAddress?: string) {
    return await prisma.$transaction(async (tx) => {
      const original = await tx.document.findUnique({
        where: { id: originalDocumentId },
        include: { lines: true },
      });
      
      if (!original) {
        throw new Error('Document original non trouvé');
      }
      
      if (original.type !== 'INVOICE') {
        throw new Error('Seule une facture peut générer un avoir');
      }
      
      // Créer l'avoir avec les mêmes lignes (quantités négatives)
      const creditNote = await this.createDocument(
        {
          type: DocumentType.CREDIT_NOTE,
          customerId: original.customerId,
          sellerCompanyId: original.sellerCompanyId,
          lines: original.lines.map(l => ({
            productId: l.productId!,
            quantity: -parseInt(l.quantity.toString(), 10),
            unitPrice: parseFloat(l.unitPrice.toString()),
            vatRate: l.vatRate,
          })),
          notes: `Avoir relatif à la facture ${original.number}`,
        },
        userId,
        ipAddress
      );
      
      // Signer automatiquement l'avoir
      await this.signDocument(creditNote.id, userId, ipAddress);
      
      return creditNote;
    });
  }
  
  /**
   * Génère les mentions légales obligatoires pour le footer
   */
  private async getLegalFooter(companyId: string): Promise<string> {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    
    if (!company) return '';
    
    return [
      `Société : ${company.name}`,
      `ICE : ${company.ice} | RC : ${company.rc} | IF : ${company.if} | Patente : ${company.patente}`,
      `Siège social : ${company.address}, ${company.city}`,
      `TVA : Non applicable (si exonéré) ou Taux normal 20%`,
      `Archivage légal : 10 ans conformément à l'article 134 du CGI`,
    ].join(' | ');
  }
}

// Export singleton
export const documentService = new DocumentService();
