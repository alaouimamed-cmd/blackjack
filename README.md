# 🇲🇦 SaaS de Facturation Conforme Maroc

Application web multi-tenant de facturation et gestion de stock, strictement alignée sur les lois marocaines en vigueur.

## ⚖️ Conformité Légale

- **Code Général des Impôts (CGI)** - Articles 91-100 (TVA), Article 142 (Timbre fiscal)
- **Loi 09-08** - Protection des données personnelles (CNDP)
- **Plan Comptable Marocain (PCM)** - Normes comptables
- **Recommandations DGI** - Facturation électronique future

## 🎯 Fonctionnalités Principales

### Facturation
- ✅ Numérotation séquentielle immuable (Format: FAC-2025-0001)
- ✅ Mentions légales obligatoires (ICE, IF, RC, Patente, MF)
- ✅ Calcul automatique TVA (20%, 14%, 10%, 7%, 0%)
- ✅ Timbre fiscal pour paiements en espèces > 5000 DH
- ✅ Gestion des avoirs avec lien facture originale
- ✅ Génération PDF conforme
- ✅ Multi-devises (MAD par défaut)

### Gestion Commerciale
- ✅ Clients & Fournisseurs avec identifiants fiscaux
- ✅ Produits & Catégories
- ✅ Suivi de stock en temps réel
- ✅ Mouvements de stock audités
- ✅ Seuils d'alerte

### Multi-Tenant & RBAC
- ✅ Séparation logique des données par entreprise
- ✅ 6 rôles prédéfinis (Admin, Directeur, Comptable, Commercial, Magasinier, Auditeur)
- ✅ Permissions granulaires par action
- ✅ Journal d'audit complet (loi 09-08)

### Reporting & Fiscalité
- ✅ Export déclarations DGI (mensuelles/trimestrielles)
- ✅ Balance âgée clients/fournisseurs
- ✅ Chiffre d'affaires par période
- ✅ TVA collectée/déductible par taux

## 🛠 Stack Technique

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, Shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 15+
- **Auth**: JWT avec RBAC
- **PDF**: @react-pdf/renderer
- **Cache**: Redis (optionnel)

## 📁 Structure du Projet

```
/workspace
├── prisma/
│   └── schema.prisma          # Schéma de données complet
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # Routes API
│   │   ├── dashboard/        # Interface protégée
│   │   ├── invoices/         # Gestion factures
│   │   ├── clients/          # Gestion clients
│   │   └── products/         # Gestion produits
│   ├── lib/
│   │   └── fiscal/
│   │       └── tax-calculator.ts  # Calculs TVA conformes CGI
│   ├── services/
│   │   ├── invoice.service.ts     # Logique métier facturation
│   │   └── pdf-generator.tsx      # Génération PDF
│   └── middleware/
│       └── auth.ts                # Authentification & RBAC
├── COMPLIANCE_CHECKLIST.md   # Checklist conformité légale
├── INSTALL_GUIDE.md          # Guide d'installation
└── TEST_STRATEGY.md          # Stratégie de tests
```

## 🚀 Démarrage Rapide

### 1. Installation

```bash
npm install
```

### 2. Configuration

Créer `.env`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/moroccan_invoicing"
JWT_SECRET="votre-secret-securise"
```

### 3. Base de Données

```bash
docker-compose up -d postgres  # Ou utiliser PostgreSQL local
npm run db:generate
npm run db:migrate
```

### 4. Lancement

```bash
npm run dev
```

Accéder à http://localhost:3000

## 📚 Documentation

- [Checklist de Conformité](./COMPLIANCE_CHECKLIST.md) - Exigences légales DGI/CNDP
- [Guide d'Installation](./INSTALL_GUIDE.md) - Déploiement local, Docker, Cloud
- [Stratégie de Tests](./TEST_STRATEGY.md) - Tests unitaires, intégration, E2E

## 🔐 Sécurité

- Hash des mots de passe (bcrypt)
- Tokens JWT avec expiration
- Protection CSRF/XSS/SQLi
- Rate limiting API
- Headers de sécurité (HSTS, CSP)
- Audit trail immutable

## 📊 Rôles Utilisateurs

| Rôle | Permissions Principales |
|------|------------------------|
| ADMIN | Accès total, configuration |
| DIRECTEUR | Validation, reporting |
| COMPTABLE | Factures, avoirs, déclarations |
| COMMERCIAL | Devis, clients |
| MAGASINIER | Produits, stock |
| AUDITEUR | Lecture seule, logs |

## ⚠️ Limites & Recommandations

### Validation Requise
- **Expert-comptable**: Valider mentions légales avant production
- **Avocat**: CGU/CGV conformes droit marocain
- **DGI**: Surveiller évolutions e-facturation

### Évolutions Futures
- E-facturation obligatoire (calendrier DGI à venir)
- QR Code sur factures
- Signature électronique
- Certification logiciel

## 📞 Références Officielles

- DGI: www.tax.gov.ma
- CNDP: www.cndp.ma
- OMPIC (ICE): www.ompic.ma
- Bulletin Officiel: www.secretariatgeneral.gov.ma

## 📄 Licence

Propriétaire - Tous droits réservés

---

**Version**: 1.0.0  
**Conforme législation 2025**  
*Dernière mise à jour: Janvier 2025*
