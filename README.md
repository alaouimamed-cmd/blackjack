# 🇲🇦 SaaS de Gestion de Stock & Facturation - Conformité Marocaine

## 📋 Vue d'ensemble

Application métier critique B2B pour la gestion de stock et facturation, conforme au cadre légal marocain :
- **Code Général des Impôts (CGI)** & **DGI**
- **CNDP** (Loi 09-08 - Protection des données)
- **Plan Comptable Général Marocain (PCG)**

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│  TypeScript + Vite + TailwindCSS + i18n (FR/AR)             │
└─────────────────────────────────────────────────────────────┘
                              ↕ REST API
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (NestJS)                           │
│  Node.js + JWT + RBAC + Audit Log + Hash SHA-256            │
└─────────────────────────────────────────────────────────────┘
                              ↕ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL (ACID)                           │
│  Contraintes financières + Transactions + Index             │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Roadmap

### Phase MVP (Cette livraison)
- [x] Structure monorepo backend/frontend
- [x] Schéma de base de données complet (Prisma)
- [x] Module d'authentification JWT + RBAC
- [x] Gestion produits & stocks (CMUP/FIFO)
- [x] Cycle de vente (Devis → Commande → BL → Facture)
- [x] Conformité facturation marocaine (numérotation, mentions ICE)
- [x] Calcul TVA automatique (0%, 10%, 14%, 20%)
- [x] Audit log & traçabilité complète
- [ ] Génération PDF/A-3
- [ ] Export XML e-facturation DGI

### Phase V1
- [ ] Portail client
- [ ] 2FA optionnel
- [ ] Tableau de bord analytique
- [ ] Intégration S3 pour stockage documents
- [ ] API webhooks

### Phase Production
- [ ] Docker + CI/CD complet
- [ ] Monitoring & alerting
- [ ] Backup automatisé
- [ ] Tests de charge

## 🛠️ Stack Technique

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| Backend | NestJS (Node.js) | Architecture modulaire, TypeScript natif, DI |
| Frontend | React + TS + Vite | Performance, écosystème riche |
| DB | PostgreSQL | ACID, contraintes financières, fiabilité |
| ORM | Prisma | Type-safety, migrations, relations complexes |
| Auth | JWT + bcrypt | Standard industrie, stateless |
| Devise | MAD (DH) | Locale marocaine, virgule décimale |

## 📦 Installation

### Prérequis
- Node.js 20+
- PostgreSQL 15+
- npm ou yarn

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configurer DATABASE_URL dans .env
npx prisma migrate dev
npm run start:dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🔐 Rôles Utilisateurs (RBAC)

| Rôle | Permissions |
|------|-------------|
| `admin` | Accès complet, configuration, gestion utilisateurs |
| `responsable_stock` | Gestion produits, entrées/sorties, inventaire |
| `comptable` | Factures, avoirs, rapports fiscaux, export DGI |
| `commercial` | Devis, commandes, clients (lecture stock) |
| `client_portail` | Consultation devis/factures, portail self-service |

## 🇲🇦 Conformité Légale Marocaine

### Facturation (CGI Art. 134 & DGI)
- ✅ Numérotation chronologique inviolable
- ✅ Mentions obligatoires (ICE, RC, IF, Patente)
- ✅ Horodatage & hash SHA-256 anti-falsification
- ✅ Archivage 10 ans (préparation PDF/A-3)

### TVA
- ✅ Taux multiples : 0%, 10%, 14%, 20%
- ✅ Exonérations & suspensions
- ✅ Régimes spéciaux (export, zones franches)

### CNDP (Loi 09-08)
- ✅ Minimisation des données
- ✅ Chiffrement au repos
- ✅ Registre de traitement
- ✅ Droit d'accès/suppression/portabilité

## 📊 Valorisation Stock

- **CMUP** (Coût Moyen Unitaire Pondéré) - Défaut PCG
- **FIFO** (First In First Out) - Optionnel
- Mise à jour automatique à chaque mouvement

## 🔗 Liens Utiles

- [Documentation API](./backend/README.md)
- [Schéma de base de données](./backend/prisma/schema.prisma)
- [Guide de conformité](./docs/COMPLIANCE.md)

---
**Version** : MVP v0.1.0  
**Licence** : Propriétaire  
**Contact** : support@example.ma
