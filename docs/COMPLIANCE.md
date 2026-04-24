# 🇲🇦 Guide de Conformité Légale Marocaine

## 1. Facturation - Code Général des Impôts (CGI) & DGI

### 1.1 Mentions Obligatoires sur les Factures

Conformément à l'article 134 du CGI et aux exigences de la DGI :

#### Pour le Vendeur (Votre Entreprise)
- [x] Raison sociale complète
- [x] Identifiant Commun de l'Entreprise (ICE) - **OBLIGATOIRE**
- [x] Registre de Commerce (RC)
- [x] Identifiant Fiscal (IF)
- [x] Numéro de Patente
- [x] Adresse complète du siège social
- [x] Téléphone et email

#### Pour l'Acheteur (Client Professionnel)
- [x] Raison sociale ou nom complet
- [x] ICE (obligatoire pour les professionnels)
- [x] RC, IF, Patente (si applicable)
- [x] Adresse complète

#### Sur Chaque Ligne de Facture
- [x] Désignation détaillée du produit/service
- [x] Quantité
- [x] Prix unitaire HT
- [x] Taux de remise (le cas échéant)
- [x] Taux de TVA applicable

#### Totaux
- [x] Total HT avant remise
- [x] Montant de la remise globale
- [x] Assiette imposable par taux de TVA
- [x] Montant de TVA par taux (0%, 10%, 14%, 20%)
- [x] Total TTC en MAD (Dirhams Marocains)
- [x] Conditions de paiement et date d'échéance

### 1.2 Numérotation des Factures

**Règles inviolables :**
1. **Chronologique** : Les numéros suivent l'ordre temporel
2. **Séquentielle** : Pas de saut dans la numérotation (1, 2, 3...)
3. **Ininterrompue** : Aucun numéro ne peut être réutilisé
4. **Unique** : Un numéro = un document unique

**Implémentation technique :**
```typescript
// Format recommandé : FAC-YYYY-NNNNNN
// Exemple : FAC-2025-000001, FAC-2025-000002...
const generateDocumentNumber = (type: DocumentType, year: number): string => {
  const prefix = getPrefix(type); // FAC, DEV, BL, AVO...
  const sequence = getNextSequence(type, year); // Incrémenté atomiquement
  return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;
};
```

### 1.3 Intégrité et Anti-Falsification

**Mécanisme de hash SHA-256 :**
```typescript
// Chaque document signé contient :
{
  hash: "sha256(contenu_complet_du_document)",
  previousHash: "hash_du_document_précédent", // Chaîne cryptographique
  signedAt: "2025-01-15T10:30:00Z",
  signedBy: "user-id"
}
```

**Journal d'audit obligatoire :**
- Qui a créé/modifié/supprimé le document
- Quand (horodatage précis)
- Depuis quelle adresse IP
- Quelles données avant/après modification

### 1.4 Archivage Légal

**Durée : 10 ans minimum** (Article 134 CGI)

**Format recommandé : PDF/A-3**
- Format pérenne ISO 19005-3
- Permet l'embarquement de fichiers XML (pour e-facturation)
- Non modifiable après génération

**Structure d'archivage :**
```
/archive/
  /2025/
    /01/
      FAC-2025-000001.pdf
      FAC-2025-000001.xml (métadonnées DGI)
      FAC-2025-000001-audit.json
```

---

## 2. Gestion de la TVA Marocaine

### 2.1 Taux Applicables

| Taux | Pourcentage | Cas d'application |
|------|-------------|-------------------|
| Exonéré | 0% | Export, produits de base, médicaments |
| Réduit 1 | 10% | Eau, électricité, hôtellerie, transports |
| Réduit 2 | 14% | Certains produits alimentaires |
| Normal | 20% | Régime général (défaut) |
| Suspendu | 0% | Suspension temporaire (attestation DGI) |

### 2.2 Calcul de la TVA

```typescript
// Algorithme de calcul conforme
function calculateVAT(lines: DocumentLine[], currency: string = 'MAD') {
  const vatDetails = {};
  
  // Regrouper par taux de TVA
  lines.forEach(line => {
    const rate = line.vatRate;
    if (!vatDetails[rate]) {
      vatDetails[rate] = { base: 0, amount: 0 };
    }
    
    const lineBase = line.quantity * line.unitPrice * (1 - line.discountPercent / 100);
    const lineVAT = lineBase * getVATPercentage(rate);
    
    vatDetails[rate].base += lineBase;
    vatDetails[rate].amount += lineVAT;
  });
  
  // Arrondi à 2 décimales (dirhams)
  Object.keys(vatDetails).forEach(rate => {
    vatDetails[rate].base = roundToDecimals(vatDetails[rate].base, 2);
    vatDetails[rate].amount = roundToDecimals(vatDetails[rate].amount, 2);
  });
  
  return vatDetails;
}
```

### 2.3 Régimes Spéciaux

#### Export (Exonération)
- TVA 0% sur les ventes à l'export
- Justificatif requis : documents douaniers
- Droit à déduction de TVA amont maintenu

#### Zones Franches
- Entreprises installées en zone franche d'exportation
- TVA suspendue sur achats locaux
- Attestation DGI requise

---

## 3. Protection des Données - CNDP (Loi 09-08)

### 3.1 Principes Fondamentaux

1. **Minimisation** : Ne collecter que les données strictement nécessaires
2. **Finalité** : Utiliser les données uniquement pour l'objectif déclaré
3. **Consentement** : Accord explicite et éclairé des personnes
4. **Durée de conservation** : Définir et respecter des durées limites
5. **Sécurité** : Chiffrement et protection contre accès non autorisés

### 3.2 Droits des Personnes

Les personnes concernées disposent de :
- ✅ Droit d'accès à leurs données
- ✅ Droit de rectification
- ✅ Droit à l'effacement (sous conditions)
- ✅ Droit à la portabilité
- ✅ Droit d'opposition au traitement

### 3.3 Mesures Techniques Implémentées

```typescript
// Chiffrement des données sensibles (CIN, etc.)
async function encryptSensitiveData(data: string): Promise<string> {
  const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Journal des traitements (registre CNDP)
interface ProcessingRegister {
  purpose: string;
  dataCategories: string[];
  recipients: string[];
  retentionPeriod: number; // jours
  securityMeasures: string[];
}
```

### 3.4 Durées de Conservation

| Type de donnée | Durée | Base légale |
|----------------|-------|-------------|
| Factures | 10 ans | CGI Art. 134 |
| Données clients (prospection) | 3 ans | CNDP |
| Logs d'audit | 5 ans | Bonnes pratiques |
| Comptes utilisateurs (inactifs) | 2 ans après départ | CNDP |

---

## 4. Plan Comptable Général Marocain (PCG)

### 4.1 Valorisation des Stocks

**Méthode CMUP (Coût Moyen Unitaire Pondéré)** - Recommandée PCG

```typescript
// Calcul du CMUP après chaque entrée de stock
function calculateCMUP(existingStock: number, existingValue: number, 
                       newQuantity: number, newValue: number): number {
  const totalQuantity = existingStock + newQuantity;
  const totalValue = existingValue + newValue;
  return totalValue / totalQuantity; // CMUP
}

// Application du CMUP aux sorties
function valueExitStock(quantity: number, cmup: number): number {
  return quantity * cmup;
}
```

**Méthode FIFO (First In First Out)** - Alternative

```typescript
// Les premiers lots entrés sont les premiers sortis
function applyFIFO(lots: StockLot[], exitQuantity: number): StockMovement[] {
  const movements: StockMovement[] = [];
  let remaining = exitQuantity;
  
  for (const lot of lots.sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime())) {
    if (remaining <= 0) break;
    
    const qtyFromLot = Math.min(remaining, lot.remainingQty);
    movements.push({
      lotId: lot.id,
      quantity: qtyFromLot,
      unitCost: lot.unitCost,
      totalValue: qtyFromLot * lot.unitCost
    });
    
    remaining -= qtyFromLot;
  }
  
  return movements;
}
```

### 4.2 Écritures Comptables Automatiques

Chaque mouvement de stock génère une trace pour la comptabilité :

| Événement | Débit | Crédit |
|-----------|-------|--------|
| Achat marchandises | Stock (Classe 3) | Fournisseur (Classe 4) |
| Vente | Client (Classe 4) | Vente (Classe 7) |
| Sortie stock | Coût Achat Vendu (Classe 6) | Stock (Classe 3) |
| Inventaire (+) | Stock (Classe 3) | Variation Stock (Classe 6) |
| Inventaire (-) | Variation Stock (Classe 6) | Stock (Classe 3) |

---

## 5. Préparation E-Facturation DGI

### 5.1 Standards Visés

- **SIMPL** : Système d'Information de la Plateforme de Liquidation (DGI)
- **Peppol** : Standard international d'échange de factures électroniques
- **UBL 2.1** : Universal Business Language

### 5.2 Structure XML Requise

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:ID>FAC-2025-000001</cbc:ID>
  <cbc:IssueDate>2025-01-15</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode> <!-- Code UBL -->
  
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cbc:EndpointID schemeID="MA:ICE">00123456789012</cbc:EndpointID>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>SARL EXEMPLE</cbc:RegistrationName>
        <cbc:CompanyID schemeID="MA:RC">123456</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <cac:AccountingCustomerParty>
    <!-- Informations client -->
  </cac:AccountingCustomerParty>
  
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="MAD">200.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="MAD">1000.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="MAD">200.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>20.00</cbc:Percent>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="MAD">1200.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>
```

### 5.3 Métadonnées de Transmission

```typescript
interface DGIExportMetadata {
  exportDate: DateTime;
  transmissionId: string; // ID de transmission DGI
  acknowledgmentStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  acknowledgmentDate?: DateTime;
  rejectionReason?: string;
  retryCount: number;
}
```

---

## 6. Checklist de Conformité

### Avant Mise en Production

- [ ] Valider le schéma de numérotation avec un expert-comptable
- [ ] Tester la chaîne de hash cryptographique
- [ ] Vérifier les calculs de TVA sur cas complexes
- [ ] Configurer les durées de conservation (archivage automatique)
- [ ] Mettre en place le chiffrement des données sensibles
- [ ] Rédiger la politique de confidentialité (CNDP)
- [ ] Former les utilisateurs aux bonnes pratiques
- [ ] Sauvegarder hors site (backup sécurisé)

### Maintenance Continue

- [ ] Audit trimestriel des logs d'accès
- [ ] Revue annuelle des habilitations (RBAC)
- [ ] Test de restauration des backups
- [ ] Veille réglementaire (évolutions DGI/CNDP)
- [ ] Mise à jour des certificats de chiffrement

---

**Document rédigé conformément à :**
- Code Général des Impôts Marocain (CGI)
- Loi 09-08 relative à la protection des données personnelles (CNDP)
- Plan Comptable Général Marocain (PCG)
- Directives de la Direction Générale des Impôts (DGI)

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2025
