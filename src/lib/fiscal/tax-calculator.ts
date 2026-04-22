/**
 * Service de calcul fiscal conforme au Code Général des Impôts marocain
 * 
 * Références légales:
 * - CGI Maroc: Articles 91 à 100 (TVA)
 * - Loi de finances en vigueur
 * - Timbre fiscal: Article 142 du CGI (paiements en espèces > 5000 DH)
 */

// Taux de TVA légaux au Maroc (CGI Article 91)
export const LEGAL_TVA_RATES = {
  NORMAL: 20.0,    // Taux normal (majorité des biens et services)
  REDUCED_14: 14.0, // Eau, électricité, produits pharmaceutiques, etc.
  REDUCED_10: 10.0, // Produits pétroliers, certains services
  REDUCED_7: 7.0,   // Produits alimentaires de base, livres, etc.
  ZERO: 0.0,       // Exportations, exonérations spécifiques
} as const;

export type TvaRate = typeof LEGAL_TVA_RATES[keyof typeof LEGAL_TVA_RATES];

/**
 * Vérifie si un taux de TVA est légal au Maroc
 */
export function isValidTvaRate(rate: number): boolean {
  return Object.values(LEGAL_TVA_RATES).includes(rate as TvaRate);
}

/**
 * Calcule le montant TVA pour un montant HT donné
 * @param amountHT - Montant Hors Taxe
 * @param tvaRate - Taux de TVA en % (doit être un taux légal)
 * @returns Objet avec montants HT, TVA et TTC
 */
export function calculateTva(amountHT: number, tvaRate: number): {
  amountHT: number;
  tvaAmount: number;
  amountTTC: number;
  tvaRate: number;
} {
  if (!isValidTvaRate(tvaRate)) {
    throw new Error(`Taux TVA invalide: ${tvaRate}%. Taux légaux: 20%, 14%, 10%, 7%, 0%`);
  }

  const tvaAmount = roundToTwoDecimals(amountHT * (tvaRate / 100));
  const amountTTC = roundToTwoDecimals(amountHT + tvaAmount);

  return {
    amountHT: roundToTwoDecimals(amountHT),
    tvaAmount,
    amountTTC,
    tvaRate,
  };
}

/**
 * Calcule le timbre fiscal obligatoire (CGI Article 142)
 * Le timbre fiscal s'applique aux paiements en espèces supérieurs à 5000 DH
 * Taux: 1% du montant TTC, plafonné à 50 DH par facture
 * 
 * Note: À partir de 2025, vérifier l'évolution législative
 */
export function calculateTimbreFiscal(
  amountTTC: number,
  paymentMethod: string
): number {
  // Seulement pour les paiements en espèces
  if (paymentMethod.toLowerCase() !== 'especes') {
    return 0;
  }

  // Seulement si montant > 5000 DH
  if (amountTTC <= 5000) {
    return 0;
  }

  // Calcul: 1% du montant, plafonné à 50 DH
  const timbre = amountTTC * 0.01;
  return Math.min(roundToTwoDecimals(timbre), 50.0);
}

/**
 * Calcule les totaux d'une facture complète
 */
export interface InvoiceTotals {
  subtotalHT: number;      // Total HT avant remises
  discountAmount: number;  // Montant de la remise
  totalHT: number;         // Total HT net
  totalTVA: number;        // Total TVA
  timbreFiscal: number;    // Timbre fiscal (si applicable)
  totalTTC: number;        // Total TTC (avec timbre)
}

export function calculateInvoiceTotals(
  items: Array<{
    quantity: number;
    unitPriceHT: number;
    discountPercent?: number;
    discountAmount?: number;
    tvaRate: number;
  }>,
  globalDiscountPercent: number = 0,
  paymentMethod: string = 'virement'
): InvoiceTotals {
  // Calcul du sous-total HT
  let subtotalHT = 0;
  
  for (const item of items) {
    const lineTotalHT = item.quantity * item.unitPriceHT;
    const lineDiscount = item.discountAmount || (lineTotalHT * ((item.discountPercent || 0) / 100));
    subtotalHT += lineTotalHT - lineDiscount;
  }

  // Remise globale
  const discountAmount = roundToTwoDecimals(subtotalHT * (globalDiscountPercent / 100));
  const totalHT = roundToTwoDecimals(subtotalHT - discountAmount);

  // Calcul TVA (somme des TVA par ligne pour précision)
  let totalTVA = 0;
  for (const item of items) {
    const lineTotalHT = item.quantity * item.unitPriceHT;
    const lineDiscount = item.discountAmount || (lineTotalHT * ((item.discountPercent || 0) / 100));
    const lineHTNet = lineTotalHT - lineDiscount;
    
    // Proportion de la remise globale appliquée à cette ligne
    const proportionalHT = lineHTNet * (totalHT / subtotalHT);
    const { tvaAmount } = calculateTva(proportionalHT, item.tvaRate);
    totalTVA += tvaAmount;
  }
  totalTVA = roundToTwoDecimals(totalTVA);

  // Total TTC avant timbre
  const totalTTCBeforeTimbre = roundToTwoDecimals(totalHT + totalTVA);
  
  // Timbre fiscal
  const timbreFiscal = calculateTimbreFiscal(totalTTCBeforeTimbre, paymentMethod);
  
  // Total TTC final (avec timbre)
  const totalTTC = roundToTwoDecimals(totalTTCBeforeTimbre + timbreFiscal);

  return {
    subtotalHT: roundToTwoDecimals(subtotalHT),
    discountAmount,
    totalHT,
    totalTVA,
    timbreFiscal,
    totalTTC,
  };
}

/**
 * Arrondit à 2 décimales (conforme Plan Comptable Marocain)
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Génère le texte légal pour exonération de TVA
 */
export function getExemptionText(exemptionCode: string): string {
  const exemptions: Record<string, string> = {
    'EXPORT': 'Exportation - Exonération TVA article 92-I-1° du CGI',
    'MEDICAL': 'Produits pharmaceutiques - Exonération temporaire',
    'FOOD': 'Produits alimentaires de base - Taux réduit 7%',
    'BOOK': 'Livres et publications - Taux réduit 7%',
    'AUTO_ENTREPRENEUR': 'Auto-entrepreneur - Franchise de TVA (CA < 500 000 DH)',
    'FRANCHISE': 'Franchise en base de TVA (article 93 du CGI)',
  };

  return exemptions[exemptionCode] || 'Exonération de TVA';
}

/**
 * Valide les mentions légales obligatoires d'une entreprise
 */
export interface LegalMentions {
  ice?: string;
  pat?: string;
  mf?: string;
  rc?: string;
  if?: string;
  legalForm?: string;
}

export function validateLegalMentions(mentions: LegalMentions): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // ICE obligatoire pour toutes les entreprises depuis 2016
  if (!mentions.ice || mentions.ice.trim() === '') {
    errors.push('ICE (Identifiant Commun de l\'Entreprise) obligatoire');
  }

  // IF obligatoire
  if (!mentions.if || mentions.if.trim() === '') {
    errors.push('IF (Identifiant Fiscal) obligatoire');
  }

  // RC obligatoire
  if (!mentions.rc || mentions.rc.trim() === '') {
    errors.push('RC (Registre de Commerce) obligatoire');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Formate un numéro de facture selon le standard marocain
 * Format: PREFIXE-ANNEE-SEQUENCE (ex: FAC-2025-0001)
 */
export function formatInvoiceNumber(
  prefix: string,
  year: number,
  sequence: number
): string {
  const paddedSequence = String(sequence).padStart(4, '0');
  return `${prefix}-${year}-${paddedSequence}`;
}

/**
 * Extrait l'année et la séquence d'un numéro de facture
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string;
  year: number;
  sequence: number;
} | null {
  const match = invoiceNumber.match(/^([A-Z]+)-(\d{4})-(\d+)$/);
  
  if (!match) {
    return null;
  }

  return {
    prefix: match[1],
    year: parseInt(match[2], 10),
    sequence: parseInt(match[3], 10),
  };
}
