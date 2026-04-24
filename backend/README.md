# 🇲🇦 Backend - API NestJS

## Architecture

```
backend/
├── prisma/
│   └── schema.prisma          # Schéma de base de données complet
├── src/
│   ├── modules/
│   │   ├── auth/              # Authentification JWT + RBAC
│   │   ├── users/             # Gestion utilisateurs
│   │   ├── documents/         # Factures, devis, BL, avoirs
│   │   ├── products/          # Produits & catégories
│   │   ├── stock/             # Mouvements & valorisation
│   │   ├── customers/         # Clients (CNDP compliant)
│   │   └── company/           # Configuration entreprise
│   ├── common/
│   │   ├── guards/            # Guards RBAC
│   │   ├── decorators/        # Décorateurs personnalisés
│   │   ├── filters/           # Filtres d'exceptions
│   │   └── interceptors/      # Intercepteurs (audit log)
│   └── main.ts                # Point d'entrée
├── .env.example               # Variables d'environnement
└── package.json
```

## Installation

```bash
cd backend
npm install

# Copier et configurer .env
cp .env.example .env

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev

# Démarrer en développement
npm run start:dev
```

## API Endpoints (MVP)

### Authentification
- `POST /api/auth/register` - Création compte
- `POST /api/auth/login` - Connexion (JWT)
- `POST /api/auth/refresh` - Rafraîchir token
- `POST /api/auth/logout` - Déconnexion

### Utilisateurs (Admin only)
- `GET /api/users` - Liste utilisateurs
- `GET /api/users/:id` - Détails utilisateur
- `PATCH /api/users/:id` - Modifier utilisateur
- `DELETE /api/users/:id` - Désactiver utilisateur

### Documents (Cycle de vente)
- `GET /api/documents` - Lister documents (filtres: type, status, date)
- `POST /api/documents` - Créer document (Devis/Commande/BL/Facture)
- `GET /api/documents/:id` - Détails document avec lignes
- `PATCH /api/documents/:id` - Modifier (brouillon seulement)
- `POST /api/documents/:id/sign` - Signer/Valider document
- `POST /api/documents/:id/credit-note` - Générer avoir
- `GET /api/documents/:id/pdf` - Télécharger PDF

### Produits & Stock
- `GET /api/products` - Liste produits
- `POST /api/products` - Créer produit
- `GET /api/products/:id` - Détails produit + stock
- `PATCH /api/products/:id` - Modifier produit
- `POST /api/stock/movements` - Enregistrer mouvement
- `GET /api/stock/valuation` - Rapport valorisation (CMUP/FIFO)

### Clients
- `GET /api/customers` - Liste clients
- `POST /api/customers` - Créer client
- `GET /api/customers/:id` - Détails client
- `PATCH /api/customers/:id` - Modifier client
- `DELETE /api/customers/:id` - Supprimer (droit CNDP)

### Entreprise
- `GET /api/company` - Configuration entreprise
- `PATCH /api/company` - Modifier configuration

## RBAC - Matrice des Permissions

| Endpoint | admin | responsable_stock | comptable | commercial |
|----------|-------|-------------------|-----------|------------|
| Users (CRUD) | ✅ | ❌ | ❌ | ❌ |
| Documents (Create) | ✅ | ❌ | ✅ | ✅ |
| Documents (Sign) | ✅ | ❌ | ✅ | ✅ |
| Documents (Delete) | ✅ | ❌ | ❌ | ❌ |
| Products (CRUD) | ✅ | ✅ | ❌ | ❌ |
| Stock Movements | ✅ | ✅ | ✅ (lecture) | ❌ |
| Customers (CRUD) | ✅ | ❌ | ✅ | ✅ |

## Conformité Implémentée

### CGI/DGI (Facturation)
- ✅ Numérotation inviolable (séquentielle, chronologique)
- ✅ Hash SHA-256 par document + chaîne cryptographique
- ✅ Mentions légales obligatoires (ICE, RC, IF, Patente)
- ✅ Calcul TVA automatique (0%, 10%, 14%, 20%)
- ✅ Journal d'audit complet

### CNDP (Données personnelles)
- ✅ Chiffrement des données sensibles (CIN)
- ✅ Consentement explicite (date de consentement)
- ✅ Droit à l'effacement (suppression clients)
- ✅ Minimisation des données collectées

### PCG (Comptabilité)
- ✅ Valorisation CMUP automatique
- ✅ Support FIFO optionnel
- ✅ Écritures comptables traçables

## Transactions ACID

Toutes les opérations critiques utilisent des transactions PostgreSQL :

```typescript
// Exemple : Création de facture avec impact stock
await prisma.$transaction(async (tx) => {
  // 1. Créer le document
  const doc = await tx.document.create({...});
  
  // 2. Créer les lignes
  await tx.documentLine.createMany({...});
  
  // 3. Impacter le stock
  await tx.stockMovement.create({...});
  await tx.product.update({...});
  
  // 4. Journal d'audit
  await tx.auditLog.create({...});
  
  // Rollback automatique si erreur
});
```

## Tests

```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e
```

## Déploiement

Voir documentation Docker dans `/docker-compose.yml` (à venir en Phase Production).

---
**Version** : MVP v0.1.0  
**Conformité** : CGI, DGI, CNDP 09-08, PCG Maroc
