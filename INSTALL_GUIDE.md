# 🚀 Guide d'Installation et Déploiement

## SaaS de Facturation Conforme Maroc

Application web multi-tenant de facturation et gestion de stock, conforme au Code Général des Impôts marocain et à la loi 09-08 (CNDP).

---

## 📋 Prérequis

### Logiciels Requis
- **Node.js** >= 20.x
- **PostgreSQL** >= 14.x
- **Docker** & **Docker Compose** (optionnel mais recommandé)
- **Git**

### Variables d'Environnement

Créer un fichier `.env` à la racine:

```bash
# ===========================================
# DATABASE
# ===========================================
DATABASE_URL="postgresql://user:password@localhost:5432/moroccan_invoicing?schema=public"

# ===========================================
# AUTHENTICATION & SECURITY
# ===========================================
JWT_SECRET="votre-secret-tres-long-et-securise-minimum-32-caracteres"
BCRYPT_ROUNDS=12

# ===========================================
# APPLICATION
# ===========================================
NEXT_PUBLIC_APP_URL="https://votre-domaine.com"
NODE_ENV="production"

# ===========================================
# EMAIL (pour notifications)
# ===========================================
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="votre-email@gmail.com"
SMTP_PASSWORD="votre-mot-de-passe-app"
SMTP_FROM="noreply@votre-domaine.com"

# ===========================================
# STORAGE (pour logos, PDFs)
# ===========================================
STORAGE_PROVIDER="local" # ou "s3"
STORAGE_PATH="./uploads"
# AWS_S3_BUCKET=your-bucket
# AWS_ACCESS_KEY_ID=your-key
# AWS_SECRET_ACCESS_KEY=your-secret
# AWS_REGION=eu-west-1

# ===========================================
# REDIS (optionnel - cache & sessions)
# ===========================================
REDIS_URL="redis://localhost:6379"

# ===========================================
# MONITORING
# ===========================================
SENTRY_DSN="" # Optionnel
```

---

## 🛠 Installation Locale (Développement)

### Étape 1: Cloner le Repository

```bash
git clone <repository-url>
cd workspace
```

### Étape 2: Installer les Dépendances

```bash
npm install
```

### Étape 3: Configurer la Base de Données

#### Option A: PostgreSQL Local

```bash
# Créer la base de données
createdb moroccan_invoicing

# Ou avec psql
psql -U postgres
CREATE DATABASE moroccan_invoicing;
\q
```

#### Option B: Docker Compose (Recommandé)

Créer `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: invoicing_db
    environment:
      POSTGRES_USER: invoicing_user
      POSTGRES_PASSWORD: secure_password_123
      POSTGRES_DB: moroccan_invoicing
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U invoicing_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: invoicing_redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Démarrer les services:

```bash
docker-compose up -d
```

### Étape 4: Initialiser la Base de Données

```bash
# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# (Optionnel) Seeder des données de test
# npm run db:seed
```

### Étape 5: Lancer en Développement

```bash
npm run dev
```

L'application sera disponible sur: http://localhost:3000

---

## 🏗 Build de Production

### Étape 1: Build Next.js

```bash
npm run build
```

### Étape 2: Démarrer le Serveur

```bash
npm start
```

Ou avec PM2 (recommandé):

```bash
npm install -g pm2
pm2 start npm --name "moroccan-invoicing" -- start
pm2 save
pm2 startup
```

---

## 🐳 Déploiement Docker

### Dockerfile

Créer `Dockerfile` à la racine:

```dockerfile
# ===========================================
# BUILD STAGE
# ===========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npm run db:generate

# Build Next.js
RUN npm run build

# ===========================================
# PRODUCTION STAGE
# ===========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose Production

Créer `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: moroccan_invoicing_app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://invoicing_user:secure_password_123@postgres:5432/moroccan_invoicing
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - invoicing_network
    volumes:
      - uploads_data:/app/uploads

  postgres:
    image: postgres:15-alpine
    container_name: moroccan_invoicing_db
    restart: always
    environment:
      POSTGRES_USER: invoicing_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: moroccan_invoicing
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - invoicing_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U invoicing_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: moroccan_invoicing_redis
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - invoicing_network

  nginx:
    image: nginx:alpine
    container_name: moroccan_invoicing_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - invoicing_network

volumes:
  postgres_data:
  redis_data:
  uploads_data:

networks:
  invoicing_network:
    driver: bridge
```

### Configuration Nginx

Créer `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

    server {
        listen 80;
        server_name votre-domaine.com;
        
        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name votre-domaine.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

        # Uploads
        client_max_body_size 10M;

        location / {
            limit_req zone=general_limit burst=20 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        location /api/ {
            limit_req zone=api_limit burst=10 nodelay;
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

### Lancement Production

```bash
# Générer secret JWT
export JWT_SECRET=$(openssl rand -hex 32)
export DB_PASSWORD=$(openssl rand -base64 24)

# Démarrer tous les services
docker-compose -f docker-compose.prod.yml up -d

# Initialiser la base
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate

# Vérifier les logs
docker-compose -f docker-compose.prod.yml logs -f
```

---

## ☁️ Déploiement Cloud

### Vercel (Recommandé pour Next.js)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Variables d'environnement à configurer dans Vercel Dashboard:
- `DATABASE_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_APP_URL`

### Railway

```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### AWS (EC2 + RDS)

1. Créer instance EC2 (Ubuntu 22.04)
2. Créer base RDS PostgreSQL
3. Installer Docker sur EC2
4. Déployer avec Docker Compose
5. Configurer Security Groups
6. Setup ALB + Certificate Manager SSL

---

## 🔧 Maintenance

### Migrations de Base de Données

```bash
# Après modification du schema Prisma
npm run db:generate
npm run db:migrate
```

### Backups Automatisés

Script `backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup PostgreSQL
docker exec moroccan_invoicing_db pg_dump -U invoicing_user moroccan_invoicing > ${BACKUP_DIR}/db_${DATE}.sql

# Backup uploads
tar -czf ${BACKUP_DIR}/uploads_${DATE}.tar.gz ./uploads

# Compression
gzip ${BACKUP_DIR}/db_${DATE}.sql

# Cleanup (garder 30 jours)
find ${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete
find ${BACKUP_DIR} -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: ${DATE}"
```

Cron job (tous les jours à 2h):

```bash
0 2 * * * /path/to/backup.sh >> /var/log/backups.log 2>&1
```

### Monitoring

```bash
# Logs application
docker-compose logs -f app

# Logs base de données
docker-compose logs -f postgres

# Performance
docker stats

# Health check
curl -f http://localhost:3000/api/health || echo "App is down"
```

---

## 📊 Checklist de Déploiement

### Pré-production
- [ ] Tests unitaires passants (`npm test`)
- [ ] Tests d'intégration passants
- [ ] Audit de sécurité (npm audit)
- [ ] Validation mentions légales par expert-comptable
- [ ] Sauvegarde de la base de production existante (si migration)

### Production
- [ ] Variables d'environnement configurées
- [ ] Certificat SSL installé
- [ ] Domaine configuré (DNS)
- [ ] Backups automatisés activés
- [ ] Monitoring mis en place
- [ ] Logs centralisés
- [ ] Rate limiting activé
- [ ] Politique de confidentialité publiée

### Post-déploiement
- [ ] Test complet des fonctionnalités
- [ ] Test génération PDF
- [ ] Test calculs TVA
- [ ] Test numérotation factures
- [ ] Test RBAC (rôles utilisateurs)
- [ ] Test exports DGI
- [ ] Documentation utilisateur fournie
- [ ] Formation équipe effectuée

---

## 🆘 Support & Dépannage

### Problèmes Courants

**Erreur de connexion database:**
```bash
docker-compose ps
docker-compose logs postgres
# Vérifier DATABASE_URL
```

**Build Next.js échoue:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

**Migrations échouent:**
```bash
npm run db:reset # Attention: efface toutes les données!
# Ou manuellement
npx prisma migrate resolve --applied "migration_name"
```

---

## 📞 Contact & Ressources

- Documentation technique: `/docs`
- Checklist conformité: `COMPLIANCE_CHECKLIST.md`
- Issues GitHub: [lien]
- Email support: support@votre-domaine.com

---

**Version:** 1.0.0  
**Dernière mise à jour:** Janvier 2025
