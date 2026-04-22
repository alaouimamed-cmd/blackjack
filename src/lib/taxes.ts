/**
 * Service de calcul fiscal conforme au Code Général des Impôts marocain
 * 
 * Références légales:
 * - CGI Maroc: Taux TVA (20%, 14%, 10%, 7%, 0%)
 * - Timbre fiscal: 0.50 DH par tranche de 100 DH (max 50 DH) pour paiements en espèces > 5000 DH
 * - Arrondis: Conformément au Plan Comptable Marocain
 */

export const TVA_RATES = {
  normal: 20.0,    // Taux normal
  reduit_14: 14.0, // Taux réduit (eau, électricité, certains produits alimentaires)
  reduit_10: 10.0, // Taux réduit (transport, hôtellerie, restauration)
  reduit_7: 7.0,   // Taux réduit (produits de première nécessité)
  zero: 0.0,       // Exonération totale
} as const;

export type TVARate = keyof typeof TVA_RATES;

/**
 * Calcule le montant TVA pour un montant HT donné
 */
export function calculateTVA(amountHT: number, tvaRate: number): number {
  if (amountHT < 0 || tvaRate < 0) {
    throw new Error('Les montants et taux doivent être positifs');
  }
  
  const tvaAmount = amountHT * (tvaRate / 100);
  return roundTo2Decimals(tvaAmount);
}

/**
 * Calcule le montant TTC à partir du HT et de la TVA
 */
export function calculateTTC(amountHT: number, tvaAmount: number): number {
  return roundTo2Decimals(amountHT + tvaAmount);
}

/**
 * Calcule le timbre fiscal marocain
 * 
 * Règles (selon CGI):
 * - Applicable uniquement aux paiements en espèces
 * - Montant > 5000 DH
 * - 0.50 DH par tranche de 100 DH
 * - Plafonné à 50 DH maximum
 */
export function calculateTimbreFiscal(amountTTC: number, paymentMethod: string): number {
  // Timbre fiscal uniquement pour les paiements en espèces > 5000 DH
  if (paymentMethod !== 'especes' || amountTTC <= 5000) {
    return 0;
  }
  
  // Calcul: 0.50 DH par tranche de 100 DH
  const tranches = Math.ceil(amountTTC / 100);
  const timbre = tranches * 0.50;
  
  // Plafond de 50 DH
  return Math.min(roundTo2Decimals(timbre), 50.0);
}

/**
 * Calcule les totaux complets d'une facture
 */
export interface InvoiceTotals {
  subtotalHT: number;      // Total HT avant remises
  discountAmount: number;  // Remise globale
  totalHT: number;         // Total HT après remises
  totalTVA: number;        // Total TVA
  timbreFiscal: number;    // Timbre fiscal (si applicable)
  totalTTC: number;        // Total TTC (avec timbre)
}

export function calculateInvoiceTotals(
  items: Array<{
    quantity: number;
    priceHT: number;
    tvaRate: number;
    discountPercent?: number;
    discountAmount?: number;
  }>,
  globalDiscountPercent: number = 0,
  globalDiscountAmount: number = 0,
  paymentMethod: string = 'especes'
): InvoiceTotals {
  // Calcul du sous-total HT
  let subtotalHT = 0;
  
  for (const item of items) {
    const itemTotalHT = calculateItemTotalHT(item);
    subtotalHT += itemTotalHT;
  }
  
  subtotalHT = roundTo2Decimals(subtotalHT);
  
  // Application des remises globales
  let totalDiscount = 0;
  
  if (globalDiscountPercent > 0) {
    totalDiscount += subtotalHT * (globalDiscountPercent / 100);
  }
  
  totalDiscount += globalDiscountAmount;
  totalDiscount = roundTo2Decimals(totalDiscount);
  
  const totalHT = roundTo2Decimals(subtotalHT - totalDiscount);
  
  // Calcul de la TVA par ligne (proportionnelle après remise)
  let totalTVA = 0;
  
  for (const item of items) {
    const itemTotalHT = calculateItemTotalHT(item);
    
    // Proportion de la remise appliquée à cet article
    const itemRatio = subtotalHT > 0 ? itemTotalHT / subtotalHT : 0;
    const itemHTAfterDiscount = itemTotalHT - (totalDiscount * itemRatio);
    
    const itemTVA = calculateTVA(itemHTAfterDiscount, item.tvaRate);
    totalTVA += itemTVA;
  }
  
  totalTVA = roundTo2Decimals(totalTVA);
  
  // Calcul du TTC hors timbre
  const totalTTCHorsTimbre = calculateTTC(totalHT, totalTVA);
  
  // Calcul du timbre fiscal
  const timbreFiscal = calculateTimbreFiscal(totalTTCHorsTimbre, paymentMethod);
  
  // Total TTC final (avec timbre)
  const totalTTC = roundTo2Decimals(totalTTCHorsTimbre + timbreFiscal);
  
  return {
    subtotalHT,
    discountAmount: totalDiscount,
    totalHT,
    totalTVA,
    timbreFiscal,
    totalTTC,
  };
}

/**
 * Calcule le total HT d'un ligne de facture
 */
function calculateItemTotalHT(item: {
  quantity: number;
  priceHT: number;
  discountPercent?: number;
  discountAmount?: number;
}): number {
  const baseTotal = item.quantity * item.priceHT;
  
  let discount = 0;
  
  if (item.discountPercent && item.discountPercent > 0) {
    discount += baseTotal * (item.discountPercent / 100);
  }
  
  if (item.discountAmount && item.discountAmount > 0) {
    discount += item.discountAmount;
  }
  
  return roundTo2Decimals(baseTotal - discount);
}

/**
 * Arrondi à 2 décimales (conforme Plan Comptable Marocain)
 */
export function roundTo2Decimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Formate un montant en MAD (Dirham marocain)
 */
export function formatMAD(amount: number, locale: 'fr-MA' | 'ar-MA' = 'fr-MA'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Valide un identifiant fiscal marocain (ICE)
 * L'ICE doit comporter 15 chiffres
 */
export function validateICE(ice: string): boolean {
  if (!ice) return false;
  
  // Nettoyage: retirer espaces et tirets
  const cleaned = ice.replace(/[\s-]/g, '');
  
  // Vérification: exactement 15 chiffres
  return /^\d{15}$/.test(cleaned);
}

/**
 * Retourne le libellé du taux de TVA
 */
export function getTVARateLabel(rate: number): string {
  switch (rate) {
    case 20:
      return 'Taux normal (20%)';
    case 14:
      return 'Taux réduit (14%)';
    case 10:
      return 'Taux réduit (10%)';
    case 7:
      return 'Taux réduit (7%)';
    case 0:
      return 'Exonéré (0%)';
    default:
      return `TVA ${rate}%`;
  }
}

/**
 * Export pour déclaration fiscale DGI
 * Génère un objet structuré pour l'export CSV/Excel
 */
export interface TaxDeclarationExport {
  period: string;        // Période (YYYY-MM)
  companyICE: string;    // ICE de l'entreprise
  totalHT: number;       // Chiffre d'affaires HT
  totalTVA: number;      // TVA collectée
  totalTTC: number;      // Chiffre d'affaires TTC
  invoicesCount: number; // Nombre de factures
  byTVARate: {           // Détail par taux de TVA
    rate: number;
    ht: number;
    tva: number;
  }[];
}

export function generateTaxDeclarationExport(
  invoices: Array<{
    date: Date;
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    items: Array<{ tvaRate: number; totalHT: number; tvaAmount: number }>;
  }>,
  companyICE: string,
  period: string // YYYY-MM
): TaxDeclarationExport {
  // Filtrer par période
  const [year, month] = period.split('-').map(Number);
  const periodInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    return invDate.getFullYear() === year && invDate.getMonth() + 1 === month;
  });
  
  // Agrégats
  const totalHT = periodInvoices.reduce((sum, inv) => sum + inv.totalHT, 0);
  const totalTVA = periodInvoices.reduce((sum, inv) => sum + inv.totalTVA, 0);
  const totalTTC = periodInvoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
  
  // Détail par taux de TVA
  const rateMap = new Map<number, { ht: number; tva: number }>();
  
  for (const invoice of periodInvoices) {
    for (const item of invoice.items) {
      const existing = rateMap.get(item.tvaRate) || { ht: 0, tva: 0 };
      existing.ht += item.totalHT;
      existing.tva += item.tvaAmount;
      rateMap.set(item.tvaRate, existing);
    }
  }
  
  const byTVARate = Array.from(rateMap.entries())
    .map(([rate, values]) => ({
      rate,
      ht: roundTo2Decimals(values.ht),
      tva: roundTo2Decimals(values.tva),
    }))
    .sort((a, b) => b.rate - a.rate);
  
  return {
    period,
    companyICE,
    totalHT: roundTo2Decimals(totalHT),
    totalTVA: roundTo2Decimals(totalTVA),
    totalTTC: roundTo2Decimals(totalTTC),
    invoicesCount: periodInvoices.length,
    byTVARate,
  };
}
