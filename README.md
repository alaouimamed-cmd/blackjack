# 🇲🇦 Application de Facturation Multi-Utilisateur - Maroc

## SaaS de Facturation Conforme au Code Général des Impôts Marocain

Application web multi-tenant de facturation et gestion de stock, conçue pour être conforme aux exigences légales marocaines:

- **Code Général des Impôts (CGI)** - Taux TVA, timbre fiscal
- **Loi 09-08 (CNDP)** - Protection des données personnelles
- **Plan Comptable Marocain** - Arrondis, écritures
- **Recommandations DGI** - Numérotation, archivage

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React 19 + TypeScript + TailwindCSS)             │
│  Dashboard | Factures | Clients | Produits | Stock          │
├─────────────────────────────────────────────────────────────┤
│  API Routes (Next.js API)                                    │
│  /api/auth | /api/invoices | /api/clients | /api/products   │
├─────────────────────────────────────────────────────────────┤
│  Services Métier                                             │
│  invoice.service.ts | pdf-generator.tsx | taxes.ts          │
├─────────────────────────────────────────────────────────────┤
│  Prisma ORM + SQLite/PostgreSQL                              │
│  Multi-tenancy | Audit trail | RBAC                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Fonctionnalités

### ✅ Facturation
- Création de factures, devis, bons de livraison, avoirs
- Numérotation automatique séquentielle (FAC-2025-001)
- Calcul automatique TVA (20%, 14%, 10%, 7%, 0%)
- Timbre fiscal automatique (paiements espèces > 5000 DH)
- Mentions légales obligatoires (ICE, IF, RC, Patente, MF)
- Immutabilité après validation
- Lien avoir/facture originale

### 👥 Multi-Utilisateur & RBAC
| Rôle | Permissions |
|------|-------------|
| **Admin** | Accès complet |
| **Directeur** | Validation, reporting |
| **Comptable** | Factures, paiements, déclarations |
| **Commercial** | Devis, clients, factures |
| **Magasinier** | Produits, stock |
| **Auditeur** | Lecture seule, logs |

### 📊 Conformité
- Export déclaration TVA
- Journal d'audit (10 ans)
- Export PDF/CSV

---

## 🚀 Installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Variables d'environnement (.env)
```env
DATABASE_URL="file:./db/dev.db"
JWT_SECRET="votre-secret-securise"
NEXT_PUBLIC_APP_NAME="Facturation Maroc"
```

### 3. Initialiser la base de données
```bash
npm run db:push
npm run db:generate
```

### 4. Démarrer
```bash
npm run dev
```

Accès: http://localhost:3000

---

## 📁 Structure

```
/workspace
├── prisma/schema.prisma    # Modèle de données
├── src/
│   ├── app/                # Pages Next.js
│   ├── lib/taxes.ts        # Calculs fiscaux
│   ├── services/           # Services métier
│   └── middleware/auth.ts  # Auth & RBAC
├── db/dev.db               # Base SQLite
└── README.md
```

---

## ⚖️ Conformité Légale

### Mentions Obligatoires (CGI Art. 144)
✅ Numéro séquentiel unique  
✅ Date d'émission  
✅ Identité vendeur/acheteur (ICE, IF, RC, Patente, MF)  
✅ Désignation, quantité, prix HT  
✅ TVA (taux et montant)  
✅ Total HT, TVA, TTC  
✅ Conditions de paiement  

### TVA (CGI)
| Taux | Application |
|------|-------------|
| 20% | Normal |
| 14% | Eau, électricité |
| 10% | Transport, hôtellerie |
| 7%  | Produits 1ère nécessité |
| 0%  | Exonérations |

### Timbre Fiscal
- Espèces > 5000 DH
- 0.50 DH / 100 DH (max 50 DH)

### Archivage
- Durée: 10 ans
- Audit trail complet

---

## 🔐 Sécurité

- JWT 24h
- bcrypt/argon2
- RBAC granulaire
- Protection XSS/CSRF/SQLi
- Multi-tenant isolé

---

## 📦 API Principales

```
POST   /api/auth/login
GET    /api/invoices
POST   /api/invoices
POST   /api/invoices/:id/validate
POST   /api/invoices/:id/cancel
GET    /api/clients
POST   /api/products
GET    /api/reports/tva
```

---

## 🚢 Déploiement

### Production Checklist
- [ ] Changer JWT_SECRET
- [ ] PostgreSQL (pas SQLite)
- [ ] HTTPS/TLS
- [ ] Backups automatiques
- [ ] Monitoring

---

## ⚠️ Recommandations

### À valider avec expert-comptable
- Taux TVA secteur
- Régime fiscal
- Obligations déclaratives

### Évolutions DGI
- E-facturation
- QR code
- Transmission directe DGI

### Bonnes pratiques
1. Hébergement Maroc (CNDP)
2. Backups immuables (10 ans)
3. Validation factures par expert-comptable
4. Monitoring anomalies

---

## 📚 Documentation Complète

- [INSTALL_GUIDE.md](./INSTALL_GUIDE.md)
- [COMPLIANCE_CHECKLIST.md](./COMPLIANCE_CHECKLIST.md)
- [TEST_STRATEGY.md](./TEST_STRATEGY.md)

---

**Conforme:** CGI Maroc, Loi 09-08 CNDP, PCM, DGI
