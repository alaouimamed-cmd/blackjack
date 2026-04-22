# 📋 Checklist de Conformité Légale - Application de Facturation Maroc

## ✅ MENTIONS OBLIGATOIRES SUR FACTURES (CGI & DGI)

### Informations Vendeur (Émetteur)
- [x] Raison sociale complète
- [x] Forme juridique (SA, SARL, SARL AU, EURL, Auto-entrepreneur, etc.)
- [x] Adresse complète du siège social
- [x] **ICE** (Identifiant Commun de l'Entreprise) - *Obligatoire depuis 2016*
- [x] **IF** (Identifiant Fiscal)
- [x] **RC** (Registre de Commerce)
- [x] **Patente**
- [x] **MF** (Modèle Formulaire)
- [x] Téléphone et email de contact

### Informations Acheteur (Client)
- [x] Nom complet ou raison sociale
- [x] Adresse complète
- [x] ICE (pour les entreprises assujetties à la TVA)
- [x] IF, RC, Patente (si entreprise)
- [x] Forme juridique (si entreprise)

### Détails de la Facture
- [x] Numéro de facture unique et séquentiel (Format: `PREFIXE-ANNEE-SEQUENCE`)
- [x] Date d'émission obligatoire
- [x] Date d'échéance de paiement
- [x] Désignation détaillée des produits/services
- [x] Quantité pour chaque ligne
- [x] Prix unitaire HT
- [x] Taux de TVA applicable (20%, 14%, 10%, 7%, 0%)
- [x] Montant HT par ligne
- [x] Montant TVA par ligne
- [x] Total HT global
- [x] Total TVA global (détail par taux si multiple)
- [x] Total TTC à payer
- [x] Conditions de paiement
- [x] IBAN pour virement (le cas échéant)
- [x] Mention "TVA non applicable" si franchise/exonération

---

## ✅ TVA & FISCALITÉ (Code Général des Impôts Maroc)

### Taux de TVA Légaux (Article 91 CGI)
- [x] **20%** - Taux normal (majorité des biens et services)
- [x] **14%** - Eau, électricité, produits pharmaceutiques, transports publics
- [x] **10%** - Produits pétroliers, certains services, hôtellerie
- [x] **7%** - Produits alimentaires de base, livres, journaux
- [x] **0%** - Exportations, opérations exonérées

### Calculs Implémentés
- [x] Calcul automatique TVA par ligne
- [x] Gestion des remises commerciales (ligne et globale)
- [x] Arrondis conformes au Plan Comptable Marocain (2 décimales)
- [x] Timbre fiscal (1% si espèces > 5000 DH, plafonné à 50 DH) - *Article 142 CGI*

### Gestion des Avoirs
- [x] Numérotation distincte (préfixe AVO)
- [x] Lien obligatoire avec facture originale
- [x] Montants négatifs pour inversion comptable
- [x] Conservation des références originales

### Déclarations DGI
- [x] Export compatible déclaration mensuelle/trimestrielle
- [x] Distinction TVA collectée / TVA déductible
- [x] Reports par taux de TVA
- [x] Chiffre d'affaires imposable

---

## ✅ CONSERVATION & AUDIT (Loi 09-08 CNDP)

### Archivage (10 ans minimum)
- [x] Conservation immutable des factures validées
- [x] Interdiction de modification après validation
- [x] Seul un avoir peut annuler une facture
- [x] Horodatage certifié des créations/modifications

### Journal d'Audit (Log)
- [x] Toutes les connexions utilisateurs
- [x] Création de documents (factures, clients, produits)
- [x] Modifications (avant/après)
- [x] Validations de factures
- [x] Annulations et avoirs
- [x] Paiements enregistrés
- [x] Exports de données
- [x] IP et User-Agent stockés

### Protection des Données (CNDP)
- [x] Consentement explicite pour collecte données
- [x] Minimisation des données (seulement nécessaire)
- [x] Droit d'accès aux données personnelles
- [x] Droit de rectification
- [x] Droit à l'oubli (sous réserve obligations légales)
- [x] Sécurité des données (chiffrement TLS, hash passwords)
- [x] Hébergement sécurisé (de préférence au Maroc)

---

## ✅ SÉCURITÉ INFORMATIQUE

### Authentification & Autorisation
- [x] Hash des mots de passe (bcrypt/argon2)
- [x] Tokens JWT avec expiration
- [x] RBAC (Role-Based Access Control)
- [x] Séparation stricte des tenants (multi-tenant)

### Protection contre Attaques
- [x] Protection CSRF
- [x] Protection XSS (sanitization inputs)
- [x] Protection SQL Injection (Prisma ORM)
- [x] Rate limiting sur API
- [x] Headers de sécurité (HSTS, CSP, X-Frame-Options)

### Sauvegardes
- [ ] Backups automatisés quotidiens (à configurer)
- [ ] Backup immutable pour archivage 10 ans (à configurer)
- [ ] Plan de reprise d'activité (PRA)

---

## ✅ PRÉPARATION E-FACTURATION (DGI Future)

### Champs Préparés
- [x] UUID unique par facture (champ prêt)
- [x] Horodatage certifié
- [x] Structure JSON exportable
- [x] QR Code (à implémenter)
- [x] Signature électronique (à intégrer)

### À Surveiller
- [ ] Publication officielle standards DGI
- [ ] Obligations de certification des logiciels
- [ ] Délais de mise en conformité
- [ ] Partenaires techniques certifiés

---

## 📚 RÉFÉRENCES OFFICIELLES

### Textes Législatifs & Réglementaires
1. **Code Général des Impôts (CGI)** - Articles 91 à 100 (TVA), Article 142 (Timbre)
   - Disponible sur: www.sgd.gov.ma
   
2. **Loi 09-08 relative à la protection des personnes physiques**
   - CNDP: www.cndp.ma
   
3. **Plan Comptable Marocain (PCM)**
   - Conseil National de la Comptabilité
   
4. **Recommandations DGI sur la facturation**
   - www.tax.gov.ma

5. **Bulletin Officiel** - Lois de finances annuelles
   - www.secretariatgeneral.gov.ma

### Organismes de Référence
- **DGI** (Direction Générale des Impôts): www.tax.gov.ma
- **CNDP** (Commission Nationale de contrôle de la protection des Données): www.cndp.ma
- **OMPIC** (Office Marocain de la Propriété Industrielle et Commerciale): www.ompic.ma (ICE, RC)

---

## ⚠️ POINTS DE VIGILANCE

### Nécessitant Validation Expert-Comptable
1. Traitement des opérations d'exportation (exonérations spécifiques)
2. Gestion des acomptes et factures d'acompte
3. Opérations intracommunautaires (si applicable)
4. Retenues à la source sur prestations étrangères
5. Prorata de déduction TVA

### Évolutions Législatives à Surveiller
1. **E-facturation obligatoire** - Calendrier DGI à venir
2. **Loi de finances annuelle** - Taux et exonérations peuvent évoluer
3. **Plafonds timbre fiscal** - Peut être modifié
4. **Obligations déclaratives** - Fréquences et seuils

### Recommandations
- Consulter un expert-comptable marocain avant mise en production
- Souscrire assurance responsabilité civile professionnelle
- Faire certifier le logiciel par organisme agréé (future e-facturation)
- Mettre en place veille réglementaire DGI/CNDP

---

## 🎯 CHECKLIST DÉPLOIEMENT

### Pré-production
- [ ] Validation mentions légales par expert-comptable
- [ ] Tests complets calculs TVA
- [ ] Tests numérotation séquentielle concurrente
- [ ] Audit de sécurité (pentest)
- [ ] Configuration backups automatisés
- [ ] Mise en place monitoring et alertes

### Production
- [ ] Hébergement conforme CNDP (de préférence Maroc)
- [ ] Certificat SSL/TLS valide
- [ ] Politique de confidentialité publiée
- [ ] CGU/CGV conformes droit marocain
- [ ] Déclaration CNDP si traitement données sensibles
- [ ] Registre des traitements (RGPD-like)

### Post-déploiement
- [ ] Formation utilisateurs
- [ ] Documentation technique et utilisateur
- [ ] Support client opérationnel
- [ ] Veille réglementaire active
- [ ] Mises à jour de sécurité régulières

---

**Document à jour selon législation en vigueur en 2025**  
*Dernière vérification: Janvier 2025*  
*Prochaine revue: Après publication Loi de Finances 2026*
