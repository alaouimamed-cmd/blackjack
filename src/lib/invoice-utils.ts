export const TVA_RATES = {
  normal: 20.0,
  reduite1: 14.0,
  reduite2: 10.0,
  sociale: 7.0,
};

// Timbre fiscal au Maroc (selon la loi de finances)
// 0.50 DH pour les factures ≤ 5000 DH
// 1.00 DH pour les factures entre 5000 et 10000 DH  
// 1.50 DH pour les factures entre 10000 et 50000 DH
// 2.00 DH pour les factures > 50000 DH
export function calculateTimbreFiscal(totalTTC: number): number {
  if (totalTTC <= 5000) return 0.50;
  if (totalTTC <= 10000) return 1.00;
  if (totalTTC <= 50000) return 1.50;
  return 2.00;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function generateInvoiceNumber(year: number, index: number): string {
  const paddedIndex = String(index).padStart(3, '0');
  return `FAC-${year}-${paddedIndex}`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-MA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

export const INVOICE_TYPES = [
  { value: 'devis', label: 'Devis' },
  { value: 'facture', label: 'Facture' },
  { value: 'bon_livraison', label: 'Bon de Livraison' },
  { value: 'avoir', label: "Note d'Avoir" },
];

export const INVOICE_STATUSES = [
  { value: 'brouillon', label: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
  { value: 'envoyee', label: 'Envoyée', color: 'bg-blue-100 text-blue-800' },
  { value: 'payee_partiellement', label: 'Payée partiellement', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'payee', label: 'Payée', color: 'bg-green-100 text-green-800' },
  { value: 'annulee', label: 'Annulée', color: 'bg-red-100 text-red-800' },
];

export const CLIENT_TYPES = [
  { value: 'particulier', label: 'Particulier' },
  { value: 'entreprise', label: 'Entreprise' },
];

export const PAYMENT_METHODS = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'effet', label: 'Effet de commerce' },
];
