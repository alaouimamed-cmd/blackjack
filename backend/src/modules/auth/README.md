# 🔐 Module d'Authentification - JWT + bcrypt + Sessions

## Fonctionnalités implémentées

- **Inscription** : Hash bcrypt (10 rounds), validation email unique
- **Connexion** : JWT token (access + refresh), sessions traçables
- **RBAC** : 5 rôles (ADMIN, RESPONSABLE_STOCK, COMPTABLE, COMMERCIAL, CLIENT_PORTAIL)
- **2FA optionnel** : Structure prête pour TOTP
- **Audit** : Logs de connexion (IP, User-Agent, timestamp)

## Endpoints API

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Créer un compte | ❌ |
| POST | `/api/auth/login` | Connexion | ❌ |
| POST | `/api/auth/logout` | Déconnexion | ✅ |
| POST | `/api/auth/refresh` | Rafraîchir token | ✅ (refresh) |
| GET | `/api/auth/me` | Profil utilisateur | ✅ |
| POST | `/api/auth/change-password` | Changer mot de passe | ✅ |

## Configuration requise (.env)

```bash
JWT_SECRET=votre_secret_super_secure_minimum_32_chars
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=votre_refresh_secret_minimum_32_chars
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
```

## Exemple d'utilisation

```typescript
// Inscription
POST /api/auth/register
{
  "email": "admin@company.ma",
  "password": "SecurePass123!",
  "firstName": "Ahmed",
  "lastName": "Benali",
  "role": "ADMIN"
}

// Connexion
POST /api/auth/login
{
  "email": "admin@company.ma",
  "password": "SecurePass123!"
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@company.ma",
    "firstName": "Ahmed",
    "lastName": "Benali",
    "role": "ADMIN"
  }
}
```

## Sécurité

- Mots de passe hashés avec bcrypt (10 rounds)
- Tokens JWT signés avec HS256
- Refresh tokens stockés en DB (révocables)
- Rate limiting sur endpoints sensibles
- Headers de sécurité (helmet)
- Validation stricte avec class-validator
