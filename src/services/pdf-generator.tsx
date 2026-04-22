/**
 * Générateur de PDF pour factures conformes à la législation marocaine
 * 
 * Utilise @react-pdf/renderer pour générer des PDF côté serveur
 * Mentions obligatoires incluses selon CGI et recommandations DGI
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Types
interface InvoiceItem {
  description: string;
  quantity: number;
  unitPriceHT: number;
  tvaRate: number;
  totalHT: number;
  tvaAmount: number;
  totalTTC: number;
}

interface Company {
  name: string;
  legalForm?: string;
  address: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  ice?: string;
  pat?: string;
  mf?: string;
  rc?: string;
  if?: string;
  logo?: string;
}

interface Client {
  name: string;
  type: string;
  firstName?: string;
  lastName?: string;
  legalForm?: string;
  address: string;
  city: string;
  postalCode?: string;
  ice?: string;
  pat?: string;
  mf?: string;
  rc?: string;
  if?: string;
}

interface InvoiceData {
  number: string;
  type: string;
  status: string;
  issueDate: Date;
  dueDate?: Date;
  company: Company;
  client: Client;
  items: InvoiceItem[];
  subtotalHT: number;
  discountAmount: number;
  totalHT: number;
  totalTVA: number;
  timbreFiscal: number;
  totalTTC: number;
  amountPaid: number;
  remainingAmount: number;
  paymentTerms?: string;
  paymentMethod?: string;
  iban?: string;
  notes?: string;
  legalMentions?: string;
}

// Styles
const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 30 },
  header: { marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between' },
  companySection: { width: '50%' },
  companyName: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  companyInfo: { fontSize: 9, lineHeight: 1.4 },
  invoiceInfo: { width: '50%', textAlign: 'right' },
  invoiceTitle: { fontSize: 18, fontWeight: 'bold', color: '#2563eb', marginBottom: 10 },
  invoiceNumber: { fontSize: 12, marginBottom: 5 },
  clientSection: { marginTop: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 5, color: '#374151' },
  table: { marginTop: 20, borderWidth: 1, borderColor: '#e5e7eb' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  colDescription: { width: '40%' },
  colCenter: { width: '15%', textAlign: 'center' },
  colRight: { width: '15%', textAlign: 'right' },
  totals: { marginTop: 20, marginLeft: 'auto', width: '50%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  totalLabel: { fontWeight: 'normal' },
  totalValue: { fontWeight: 'bold' },
  totalTTC: { borderTopWidth: 2, borderTopColor: '#2563eb', paddingTop: 10, marginTop: 5, fontSize: 12 },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10, fontSize: 8, color: '#6b7280' },
  legalMentions: { marginTop: 20, fontSize: 8, color: '#6b7280', lineHeight: 1.4 },
  watermark: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)', fontSize: 40, color: '#e5e7eb', opacity: 0.5 },
});

export const InvoicePDF: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} DH`;
  const formatDate = (date: Date) => new Date(date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  const getLegalMentions = () => {
    const mentions: string[] = [];
    if (data.company.ice) mentions.push(`ICE: ${data.company.ice}`);
    if (data.company.if) mentions.push(`IF: ${data.company.if}`);
    if (data.company.rc) mentions.push(`RC: ${data.company.rc}`);
    if (data.company.pat) mentions.push(`Patente: ${data.company.pat}`);
    if (data.company.mf) mentions.push(`MF: ${data.company.mf}`);
    return mentions.join(' | ');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.status === 'DRAFT' && <Text style={styles.watermark}>BROUILLON</Text>}
        {data.status === 'CANCELLED' && <Text style={styles.watermark}>ANNULÉE</Text>}

        <View style={styles.header}>
          <View style={styles.companySection}>
            <Text style={styles.companyName}>{data.company.name}</Text>
            <Text style={styles.companyInfo}>
              {data.company.legalForm && `${data.company.legalForm} au `}
              {data.company.address}\n{data.company.postalCode && `${data.company.postalCode} `}{data.company.city}
              {'\n'}{data.company.phone && `Tél: ${data.company.phone}`}
              {data.company.email && ` | Email: ${data.company.email}`}
            </Text>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.invoiceTitle}>
              {data.type === 'INVOICE' && 'FACTURE'}
              {data.type === 'QUOTE' && 'DEVIS'}
              {data.type === 'CREDIT_NOTE' && 'AVOIR'}
              {data.type === 'DELIVERY' && 'BON DE LIVRAISON'}
            </Text>
            <Text style={styles.invoiceNumber}>N° {data.number}</Text>
            <Text>Date d'émission: {formatDate(data.issueDate)}</Text>
            {data.dueDate && <Text>Date d'échéance: {formatDate(data.dueDate)}</Text>}
          </View>
        </View>

        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Client:</Text>
          <Text style={styles.companyName}>{data.client.name}</Text>
          <Text style={styles.companyInfo}>
            {data.client.address}\n{data.client.postalCode && `${data.client.postalCode} `}{data.client.city}
            {'\n'}{data.client.type === 'entreprise' && data.client.legalForm && `${data.client.legalForm}\n`}
            {data.client.ice && `ICE: ${data.client.ice}`}
            {data.client.if && ` | IF: ${data.client.if}`}
            {data.client.rc && ` | RC: ${data.client.rc}`}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Désignation</Text>
            <Text style={styles.colCenter}>Quantité</Text>
            <Text style={styles.colRight}>Prix Unit. HT</Text>
            <Text style={styles.colRight}>TVA %</Text>
            <Text style={styles.colRight}>Total HT</Text>
          </View>
          {data.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colCenter}>{item.quantity}</Text>
              <Text style={styles.colRight}>{formatCurrency(item.unitPriceHT)}</Text>
              <Text style={styles.colRight}>{item.tvaRate}%</Text>
              <Text style={styles.colRight}>{formatCurrency(item.totalHT)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT:</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.subtotalHT)}</Text>
          </View>
          {data.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Remise:</Text>
              <Text style={styles.totalValue}>-{formatCurrency(data.discountAmount)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT Net:</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.totalHT)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TVA:</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.totalTVA)}</Text>
          </View>
          {data.timbreFiscal > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Timbre fiscal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(data.timbreFiscal)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.totalTTC]}>
            <Text style={[styles.totalLabel, { fontSize: 12 }]}>Net à payer TTC:</Text>
            <Text style={[styles.totalValue, { fontSize: 12 }]}>{formatCurrency(data.totalTTC)}</Text>
          </View>
          {data.amountPaid > 0 && (
            <>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Déjà payé:</Text>
                <Text style={styles.totalValue}>{formatCurrency(data.amountPaid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Reste à payer:</Text>
                <Text style={[styles.totalValue, { color: '#dc2626' }]}>{formatCurrency(data.remainingAmount)}</Text>
              </View>
            </>
          )}
        </View>

        {(data.paymentTerms || data.iban || data.notes) && (
          <View style={{ marginTop: 20 }}>
            {data.paymentTerms && (
              <>
                <Text style={styles.sectionTitle}>Conditions de paiement:</Text>
                <Text>{data.paymentTerms}</Text>
              </>
            )}
            {data.iban && (
              <>
                <Text style={styles.sectionTitle}>Coordonnées bancaires:</Text>
                <Text>IBAN: {data.iban}</Text>
              </>
            )}
            {data.notes && (
              <>
                <Text style={styles.sectionTitle}>Notes:</Text>
                <Text>{data.notes}</Text>
              </>
            )}
          </View>
        )}

        <View style={styles.legalMentions}>
          <Text>Mentions légales:</Text>
          <Text>{getLegalMentions()}</Text>
          {data.legalMentions && <Text>{data.legalMentions}</Text>}
          <Text>TVA conforme au Code Général des Impôts marocain (Articles 91-100)</Text>
          {data.timbreFiscal > 0 && (
            <Text>Timbre fiscal appliqué conformément à l'article 142 du CGI (paiement en espèces)</Text>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>{data.company.name} - {getLegalMentions()}</Text>
          <Text>Document généré électroniquement - Conservez cette facture pendant 10 ans (obligation légale)</Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateInvoicePdf(data: InvoiceData): Promise<Blob> {
  const { pdf } = await import('@react-pdf/renderer');
  const document = <InvoicePDF data={data} />;
  return await pdf(document).toBlob();
}

export default InvoicePDF;
