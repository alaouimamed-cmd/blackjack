import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';

export interface InvoiceData {
  id: string;
  number: string;
  issueDate: Date;
  dueDate: Date | null;
  status: string;
  company: {
    name: string;
    ice: string;
    rc: string;
    if: string;
    patente: string;
    address: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  customer: {
    type: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    ice?: string;
    rc?: string;
    if?: string;
    patente?: string;
    address: string;
    city: string;
    email?: string;
    phone?: string;
  };
  lines: Array<{
    productName: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    vatRate: string;
    vatAmount: number;
    totalHt: number;
    totalTtc: number;
  }>;
  subtotalHt: number;
  totalDiscount: number;
  vatBreakdown: Array<{
    rate: number;
    base: number;
    amount: number;
  }>;
  totalHt: number;
  totalTva: number;
  timbreFiscal: number;
  totalTtc: number;
  paymentTerms?: string;
  notes?: string;
  hash: string;
}

@Injectable()
export class PdfService {
  private readonly uploadDir: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.uploadDir = this.configService.get('PDF_STORAGE_PATH', './uploads/invoices');
    
    // Créer le répertoire s'il n'existe pas
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Génère une facture au format PDF/A-3 conforme à la législation marocaine
   */
  async generateInvoice(invoiceId: string): Promise<{ filePath: string; hash: string }> {
    const invoice = await this.prisma.document.findUnique({
      where: { id: invoiceId },
      include: {
        company: true,
        customer: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new BadRequestException('Facture non trouvée');
    }

    if (invoice.type !== 'INVOICE') {
      throw new BadRequestException('Ce document n\'est pas une facture');
    }

    // Préparer les données
    const invoiceData = this.prepareInvoiceData(invoice);

    // Calculer le hash SHA-256 pour l'intégrité (exigence DGI)
    const hashContent = JSON.stringify({
      number: invoice.number,
      issueDate: invoice.issueDate.toISOString(),
      totalTtc: invoice.totalTtc.toString(),
      customerId: invoice.customerId,
      lines: invoice.lines.map(l => ({
        productId: l.productId,
        quantity: l.quantity.toString(),
        unitPrice: l.unitPrice.toString(),
        vatRate: l.vatRate,
      })),
    });
    const hash = createHash('sha256').update(hashContent).digest('hex');

    // Mettre à jour la facture avec le hash
    await this.prisma.document.update({
      where: { id: invoiceId },
      data: { hash },
    });

    // Générer le PDF
    const fileName = `FAC-${invoice.number}-${hash.substring(0, 8)}.pdf`;
    const filePath = path.join(this.uploadDir, fileName);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 50,
          bottom: 50,
          left: 40,
          right: 40,
        },
        lang: 'fr',
      });

      // Métadonnées PDF/A-3
      doc.info.Title = `Facture ${invoice.number}`;
      doc.info.Author = invoice.company.name;
      doc.info.Subject = 'Facture commerciale - Maroc';
      doc.info.Keywords = 'facture, TVA, ICE, Maroc, DGI';
      doc.info.Creator = 'MA Invoice - Système de facturation conforme';
      doc.info.Producer = 'MA Invoice PDF Generator';
      doc.info.CreationDate = new Date();

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      stream.on('finish', () => {
        resolve({ filePath, hash });
      });

      stream.on('error', (error) => {
        reject(error);
      });

      // En-tête
      this.drawHeader(doc, invoiceData);

      // Informations vendeur/acheteur
      this.drawParties(doc, invoiceData);

      // Détails de la facture
      this.drawInvoiceDetails(doc, invoiceData);

      // Tableau des lignes
      this.drawLinesTable(doc, invoiceData);

      // Totaux
      this.drawTotals(doc, invoiceData);

      // Pied de page
      this.drawFooter(doc, invoiceData);

      // Hash d'intégrité
      this.drawIntegrityHash(doc, hash);

      doc.end();
    });
  }

  private prepareInvoiceData(invoice: any): InvoiceData {
    const vatBreakdown: Array<{ rate: number; base: number; amount: number }> = [];
    const vatMap = new Map<number, { base: number; amount: number }>();

    invoice.lines.forEach((line: any) => {
      const rate = this.vatRateToNumber(line.vatRate);
      const htAmount = line.quantity * line.unitPrice * (1 - (line.discount || 0) / 100);
      const vatAmount = htAmount * rate;

      const existing = vatMap.get(rate) || { base: 0, amount: 0 };
      vatMap.set(rate, {
        base: existing.base + htAmount,
        amount: existing.amount + vatAmount,
      });
    });

    vatMap.forEach((value, rate) => {
      vatBreakdown.push({
        rate,
        base: Math.round(value.base * 100) / 100,
        amount: Math.round(value.amount * 100) / 100,
      });
    });

    return {
      id: invoice.id,
      number: invoice.number,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      company: {
        name: invoice.company.name,
        ice: invoice.company.ice,
        rc: invoice.company.rc,
        if: invoice.company.if,
        patente: invoice.company.patente,
        address: invoice.company.address,
        phone: invoice.company.phone,
        email: invoice.company.email,
        website: invoice.company.website,
      },
      customer: {
        type: invoice.customer.type,
        companyName: invoice.customer.companyName,
        firstName: invoice.customer.firstName,
        lastName: invoice.customer.lastName,
        ice: invoice.customer.ice,
        rc: invoice.customer.rc,
        if: invoice.customer.if,
        patente: invoice.customer.patente,
        address: invoice.customer.address,
        city: invoice.customer.city,
        email: invoice.customer.email,
        phone: invoice.customer.phone,
      },
      lines: invoice.lines.map((line: any) => ({
        productName: line.product?.name || line.description,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        vatRate: line.vatRate,
        vatAmount: line.vatAmount,
        totalHt: line.totalHt,
        totalTtc: line.totalTtc,
      })),
      subtotalHt: invoice.subtotalHt,
      totalDiscount: invoice.totalDiscount,
      vatBreakdown,
      totalHt: invoice.totalHt,
      totalTva: invoice.totalTva,
      timbreFiscal: invoice.timbreFiscal || 0,
      totalTtc: invoice.totalTtc,
      paymentTerms: invoice.paymentTerms,
      notes: invoice.notes,
      hash: invoice.hash || '',
    };
  }

  private vatRateToNumber(rate: string): number {
    const mapping: Record<string, number> = {
      EXEMPT: 0,
      REDUCED_1: 0.10,
      REDUCED_2: 0.14,
      STANDARD: 0.20,
      SUSPENDED: 0,
    };
    return mapping[rate] || 0;
  }

  private drawHeader(doc: PDFDocument, data: InvoiceData) {
    // Titre
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text('FACTURE', 400, 50, { align: 'right' });

    // Numéro de facture
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`N° ${data.number}`, 400, 75, { align: 'right' });

    // Date d'émission
    doc.text(
      `Date: ${this.formatDate(data.issueDate)}`,
      400,
      95,
      { align: 'right' },
    );

    // Ligne de séparation
    doc.moveTo(40, 120).lineTo(555, 120).stroke();
  }

  private drawParties(doc: PDFDocument, data: InvoiceData) {
    // Vendeur
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('ÉMETTEUR', 40, 140);

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(data.company.name, 40, 155);
    
    doc.text(data.company.address, 40, 168);
    
    if (data.company.phone) {
      doc.text(`Tél: ${data.company.phone}`, 40, 181);
    }
    
    if (data.company.email) {
      doc.text(`Email: ${data.company.email}`, 40, 194);
    }

    // Identifiants fiscaux
    doc
      .fontSize(8)
      .font('Helvetica')
      .text(`ICE: ${data.company.ice}`, 40, 210);
    
    doc.text(`RC: ${data.company.rc}`, 150, 210);
    doc.text(`IF: ${data.company.if}`, 260, 210);
    doc.text(`Patente: ${data.company.patente}`, 370, 210);

    // Acheteur
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('CLIENT', 40, 240);

    const customerName = data.customer.type === 'PROFESSIONAL' 
      ? data.customer.companyName 
      : `${data.customer.firstName} ${data.customer.lastName}`;

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(customerName || '', 40, 255);
    
    doc.text(`${data.customer.address}, ${data.customer.city}`, 40, 268);
    
    if (data.customer.email) {
      doc.text(`Email: ${data.customer.email}`, 40, 281);
    }
    
    if (data.customer.phone) {
      doc.text(`Tél: ${data.customer.phone}`, 40, 294);
    }

    // Identifiants fiscaux client (si pro)
    if (data.customer.type === 'PROFESSIONAL' && data.customer.ice) {
      doc
        .fontSize(8)
        .font('Helvetica')
        .text(`ICE: ${data.customer.ice}`, 40, 310);
      
      if (data.customer.rc) {
        doc.text(`RC: ${data.customer.rc}`, 150, 310);
      }
      
      if (data.customer.if) {
        doc.text(`IF: ${data.customer.if}`, 260, 310);
      }
    }
  }

  private drawInvoiceDetails(doc: PDFDocument, data: InvoiceData) {
    const yStart = 340;
    
    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`Référence: ${data.number}`, 350, yStart);
    
    doc.text(
      `Date d'échéance: ${data.dueDate ? this.formatDate(data.dueDate) : 'À réception'}`,
      350,
      yStart + 13,
    );

    if (data.paymentTerms) {
      doc.text(`Conditions de paiement: ${data.paymentTerms}`, 350, yStart + 26);
    }

    doc.text(`Statut: ${this.translateStatus(data.status)}`, 350, yStart + 39);
  }

  private drawLinesTable(doc: PDFDocument, data: InvoiceData) {
    let yPosition = 400;

    // En-têtes du tableau
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#333333');

    const headers = ['Désignation', 'Qté', 'P.U. HT', 'Remise %', 'TVA %', 'Total HT'];
    const xPositions = [40, 300, 350, 410, 460, 510];

    headers.forEach((header, index) => {
      doc.text(header, xPositions[index], yPosition, { width: 60, align: index === 0 ? 'left' : 'right' });
    });

    yPosition += 20;
    doc.moveTo(40, yPosition).lineTo(555, yPosition).stroke();
    yPosition += 10;

    // Lignes
    doc.font('Helvetica').fillColor('#000000');

    data.lines.forEach((line) => {
      doc.text(
        line.productName,
        40,
        yPosition,
        { width: 250, align: 'left' },
      );

      doc.text(line.quantity.toString(), 300, yPosition, { width: 45, align: 'right' });
      doc.text(this.formatCurrency(line.unitPrice), 350, yPosition, { width: 55, align: 'right' });
      doc.text(line.discount ? `${line.discount}%` : '-', 410, yPosition, { width: 45, align: 'right' });
      doc.text(this.vatRateToPercent(line.vatRate), 460, yPosition, { width: 45, align: 'right' });
      doc.text(this.formatCurrency(line.totalHt), 510, yPosition, { width: 45, align: 'right' });

      yPosition += 20;

      if (line.description && line.description !== line.productName) {
        doc
          .fontSize(8)
          .font('Helvetica-Oblique')
          .fillColor('#666666')
          .text(line.description, 50, yPosition - 20, { width: 240, align: 'left' });
        
        doc.fontSize(9).font('Helvetica').fillColor('#000000');
      }
    });

    yPosition += 10;
    doc.moveTo(40, yPosition).lineTo(555, yPosition).stroke();
  }

  private drawTotals(doc: PDFDocument, data: InvoiceData) {
    let yPosition = 620;

    doc
      .fontSize(10)
      .font('Helvetica')
      .text('Total HT:', 350, yPosition, { width: 100, align: 'right' });
    
    doc
      .font('Helvetica-Bold')
      .text(this.formatCurrency(data.totalHt), 470, yPosition, { width: 85, align: 'right' });

    yPosition += 20;

    data.vatBreakdown.forEach((vat) => {
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(`TVA ${vat.rate * 100}%:`, 350, yPosition, { width: 100, align: 'right' });
      
      doc.text(this.formatCurrency(vat.amount), 470, yPosition, { width: 85, align: 'right' });
      
      yPosition += 18;
    });

    if (data.timbreFiscal > 0) {
      doc
        .fontSize(9)
        .font('Helvetica')
        .text('Timbre fiscal:', 350, yPosition, { width: 100, align: 'right' });
      
      doc.text(this.formatCurrency(data.timbreFiscal), 470, yPosition, { width: 85, align: 'right' });
      
      yPosition += 20;
    }

    doc.moveTo(350, yPosition).lineTo(555, yPosition).stroke();
    yPosition += 10;

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('NET À PAYER TTC:', 350, yPosition, { width: 100, align: 'right' });
    
    doc
      .fontSize(14)
      .text(this.formatCurrency(data.totalTtc), 470, yPosition, { width: 85, align: 'right' });

    yPosition += 30;
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .text(`Arrêté la présente facture à la somme de: ${this.numberToLetters(data.totalTtc)} Dirhams TTC`, 40, yPosition, { width: 515, align: 'left' });
  }

  private drawFooter(doc: PDFDocument, data: InvoiceData) {
    if (data.notes) {
      doc
        .fontSize(8)
        .font('Helvetica')
        .text('Notes:', 40, 750);
      
      doc
        .fontSize(7)
        .font('Helvetica-Oblique')
        .text(data.notes, 40, 760, { width: 515, align: 'left' });
    }

    const legalFooter = [
      `Société: ${data.company.name} - ICE: ${data.company.ice}`,
      `RC: ${data.company.rc} - IF: ${data.company.if} - Patente: ${data.company.patente}`,
      'Conforme à la législation fiscale marocaine (Code Général des Impôts)',
      'TVA collectée selon l\'article 88 du CGI',
    ];

    doc
      .fontSize(6)
      .font('Helvetica')
      .fillColor('#999999')
      .text(legalFooter.join(' | '), 40, 790, { width: 515, align: 'center' });
  }

  private drawIntegrityHash(doc: PDFDocument, hash: string) {
    doc
      .fontSize(6)
      .font('Helvetica')
      .fillColor('#cccccc')
      .text(`Hash SHA-256: ${hash}`, 40, 810, { width: 515, align: 'center' });
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' DH';
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-MA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  private translateStatus(status: string): string {
    const mapping: Record<string, string> = {
      DRAFT: 'Brouillon',
      SENT: 'Envoyée',
      PAID: 'Payée',
      PARTIAL: 'Partiellement payée',
      OVERDUE: 'En retard',
      CANCELLED: 'Annulée',
    };
    return mapping[status] || status;
  }

  private vatRateToPercent(rate: string): string {
    const rateNum = this.vatRateToNumber(rate);
    return `${rateNum * 100}%`;
  }

  private numberToLetters(amount: number): string {
    const integerPart = Math.floor(amount);
    if (integerPart === 0) {
      return 'zéro';
    }
    return integerPart.toString();
  }

  async generateCreditNote(creditNoteId: string): Promise<{ filePath: string; hash: string }> {
    throw new BadRequestException('Génération d\'avoir non encore implémentée');
  }
}
