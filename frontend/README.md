# MA INVOICE - Frontend

Application React de gestion de stock et facturation conforme au cadre légal marocain.

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 18+ 
- npm ou yarn
- Backend MA INVOICE en cours d'exécution (port 4000)

### Installation

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Démarrer le serveur de développement
npm run dev
```

L'application sera disponible sur http://localhost:5173

## 📁 Structure du Projet

```
src/
├── components/         # Composants réutilisables
│   ├── layout/        # Layout principal (Sidebar, Header)
│   └── ui/            # Composants UI (Button, Input, Table...)
├── context/           # Contextes React (Auth, etc.)
├── hooks/             # Custom hooks
├── pages/             # Pages de l'application
│   ├── auth/          # Login, Register
│   ├── dashboard/     # Tableau de bord
│   ├── customers/     # Gestion clients
│   ├── products/      # Gestion produits/stock
│   └── invoices/      # Documents (factures, devis...)
├── services/          # Services API
│   ├── api.ts         # Configuration Axios
│   ├── auth.service.ts
│   ├── customer.service.ts
│   ├── product.service.ts
│   ├── document.service.ts
│   └── dashboard.service.ts
├── types/             # Types TypeScript
├── utils/             # Utilitaires
│   ├── format.ts      # Formatage devise MAD, dates, nombres
│   └── validations.ts # Schémas Zod pour formulaires
├── App.tsx            # Routes et navigation
├── main.tsx           # Point d'entrée
└── index.css          # Styles globaux Tailwind
```

## 🔐 Authentification

Le frontend utilise JWT avec refresh token automatique :

- Stockage sécurisé dans localStorage
- Refresh token automatique avant expiration
- Déconnexion automatique si refresh échoue
- Protection des routes par rôle (RBAC)

### Credentials de Test

```
Email: admin@mainvoice.ma
Mot de passe: Admin123!
```

## 🎨 Conformité Marocaine

### Champs Spécifiques

- **ICE** : Validation 15 chiffres obligatoire
- **Téléphone** : Format marocain (+212 ou 0 suivi de 9 chiffres)
- **Devise** : Format MAD avec espace comme séparateur de milliers (1 234,56 DH)
- **Dates** : Format français DD/MM/YYYY
- **TVA** : Taux marocains (0%, 10%, 14%, 20%)

### CNDP (Loi 09-08)

- Case à cocher consentement obligatoire
- Information claire sur le traitement des données
- Droit d'accès et de suppression implémenté

## 🛠️ Technologies

- **React 18** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Vite** - Build tool ultra-rapide
- **TailwindCSS** - Framework CSS utilitaire
- **React Router v6** - Navigation
- **Zustand** - State management
- **React Hook Form** - Gestion de formulaires
- **Zod** - Validation de schémas
- **Axios** - Client HTTP

## 📝 Scripts Disponibles

```bash
# Développement
npm run dev

# Build production
npm run build

# Preview build production
npm run preview

# Linting
npm run lint

# Type checking
npm run type-check
```

## 🔗 Variables d'Environnement

Créez un fichier `.env.local` à la racine :

```env
VITE_API_URL=http://localhost:4000/api
VITE_APP_NAME="MA INVOICE"
```

## 📱 Responsive Design

L'application est entièrement responsive :

- Mobile : Menu burger, tableaux scrollables
- Tablet : Layout adaptatif
- Desktop : Sidebar fixe, grilles multi-colonnes

## 🚧 Fonctionnalités en Cours

Les pages suivantes sont des placeholders à implémenter :

- [ ] ProductList - Liste complète des produits
- [ ] ProductCreate - Formulaire création produit
- [ ] ProductEdit - Modification produit
- [ ] DocumentList - Liste des documents
- [ ] DocumentCreate - Création facture/devis
- [ ] DocumentDetail - Détail + PDF

## 📄 Licence

Propriétaire - MA INVOICE © 2025
