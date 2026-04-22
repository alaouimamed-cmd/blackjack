# 🧪 Stratégie de Test & Validation

## SaaS de Facturation Conforme Maroc

---

## 1. Tests Unitaires

### Configuration Jest

```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/react @testing-library/jest-dom
```

`jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### Tests Calculs Fiscaux

`src/lib/fiscal/__tests__/tax-calculator.test.ts`:

```typescript
import {
  calculateTva,
  calculateTimbreFiscal,
  calculateInvoiceTotals,
  isValidTvaRate,
  formatInvoiceNumber,
  validateLegalMentions,
} from '../tax-calculator';

describe('Tax Calculator - Conformité CGI Maroc', () => {
  
  describe('isValidTvaRate', () => {
    it('doit valider les taux légaux marocains', () => {
      expect(isValidTvaRate(20)).toBe(true);
      expect(isValidTvaRate(14)).toBe(true);
      expect(isValidTvaRate(10)).toBe(true);
      expect(isValidTvaRate(7)).toBe(true);
      expect(isValidTvaRate(0)).toBe(true);
    });

    it('doit rejeter les taux non légaux', () => {
      expect(isValidTvaRate(25)).toBe(false);
      expect(isValidTvaRate(15)).toBe(false);
      expect(isValidTvaRate(5.5)).toBe(false);
    });
  });

  describe('calculateTva', () => {
    it('doit calculer correctement la TVA 20%', () => {
      const result = calculateTva(1000, 20);
      expect(result.amountHT).toBe(1000);
      expect(result.tvaAmount).toBe(200);
      expect(result.amountTTC).toBe(1200);
    });

    it('doit calculer correctement la TVA 14%', () => {
      const result = calculateTva(1000, 14);
      expect(result.tvaAmount).toBe(140);
      expect(result.amountTTC).toBe(1140);
    });

    it('doit arrondir à 2 décimales (PCM)', () => {
      const result = calculateTva(100.333, 20);
      expect(result.tvaAmount).toBe(20.07); // Arrondi
    });

    it('doit lancer une erreur pour taux invalide', () => {
      expect(() => calculateTva(1000, 25)).toThrow('Taux TVA invalide');
    });
  });

  describe('calculateTimbreFiscal', () => {
    it('doit appliquer timbre pour espèces > 5000 DH', () => {
      const timbre = calculateTimbreFiscal(6000, 'especes');
      expect(timbre).toBe(50); // Plafonné à 50 DH
    });

    it('doit calculer 1% si < 50 DH', () => {
      const timbre = calculateTimbreFiscal(5100, 'especes');
      expect(timbre).toBe(51); // 1% de 5100
    });

    it('ne doit pas appliquer pour virement', () => {
      const timbre = calculateTimbreFiscal(10000, 'virement');
      expect(timbre).toBe(0);
    });

    it('ne doit pas appliquer si <= 5000 DH', () => {
      const timbre = calculateTimbreFiscal(5000, 'especes');
      expect(timbre).toBe(0);
    });
  });

  describe('calculateInvoiceTotals', () => {
    it('doit calculer totaux avec une ligne', () => {
      const items = [{
        quantity: 2,
        unitPriceHT: 500,
        tvaRate: 20,
      }];
      
      const totals = calculateInvoiceTotals(items);
      
      expect(totals.subtotalHT).toBe(1000);
      expect(totals.totalHT).toBe(1000);
      expect(totals.totalTVA).toBe(200);
      expect(totals.totalTTC).toBe(1200);
    });

    it('doit gérer remises globales', () => {
      const items = [{
        quantity: 1,
        unitPriceHT: 1000,
        tvaRate: 20,
      }];
      
      const totals = calculateInvoiceTotals(items, 10); // 10% remise
      
      expect(totals.discountAmount).toBe(100);
      expect(totals.totalHT).toBe(900);
      expect(totals.totalTVA).toBe(180);
      expect(totals.totalTTC).toBe(1080);
    });

    it('doit additionner plusieurs lignes avec TVA différente', () => {
      const items = [
        { quantity: 1, unitPriceHT: 1000, tvaRate: 20 },
        { quantity: 1, unitPriceHT: 500, tvaRate: 14 },
      ];
      
      const totals = calculateInvoiceTotals(items);
      
      expect(totals.totalHT).toBe(1500);
      expect(totals.totalTVA).toBe(270); // 200 + 70
      expect(totals.totalTTC).toBe(1770);
    });
  });

  describe('formatInvoiceNumber', () => {
    it('doit formater selon standard marocain', () => {
      expect(formatInvoiceNumber('FAC', 2025, 1))
        .toBe('FAC-2025-0001');
      
      expect(formatInvoiceNumber('AVO', 2025, 42))
        .toBe('AVO-2025-0042');
    });
  });

  describe('validateLegalMentions', () => {
    it('doit valider mentions complètes', () => {
      const result = validateLegalMentions({
        ice: '123456789012345',
        if: '12345678',
        rc: '123456',
        pat: '12345678',
        mf: '123456789012345',
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('doit rejeter sans ICE', () => {
      const result = validateLegalMentions({
        if: '12345678',
        rc: '123456',
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ICE obligatoire');
    });
  });
});
```

---

## 2. Tests d'Intégration

### Tests Service Factures

`src/services/__tests__/invoice.service.test.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import {
  createInvoice,
  validateInvoice,
  createCreditNote,
  recordPayment,
} from '../invoice.service';

const prisma = new PrismaClient();

describe('Invoice Service - Tests d\'intégration', () => {
  
  let testCompanyId: string;
  let testClientId: string;
  let testUserId: string;

  beforeAll(async () => {
    // Setup: Créer tenant, company, client, user de test
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        slug: 'test-tenant',
      },
    });

    const company = await prisma.company.create({
      data: {
        tenantId: tenant.id,
        name: 'Société Test SARL',
        legalForm: 'SARL',
        address: '123 Avenue Mohammed V',
        city: 'Casablanca',
        ice: '123456789012345',
        if: '12345678',
        rc: '123456',
        pat: '12345678',
        mf: '123456789012345',
      },
    });
    testCompanyId = company.id;

    const client = await prisma.client.create({
      data: {
        companyId: company.id,
        type: 'entreprise',
        name: 'Client Test SA',
        address: '456 Boulevard Hassan II',
        city: 'Rabat',
        ice: '987654321098765',
        if: '87654321',
        rc: '654321',
      },
    });
    testClientId = client.id;

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'COMPTABLE',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.invoice.deleteMany();
    await prisma.client.deleteMany();
    await prisma.company.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('createInvoice', () => {
    it('doit créer une facture avec numérotation automatique', async () => {
      const result = await createInvoice({
        companyId: testCompanyId,
        clientId: testClientId,
        type: 'INVOICE',
        items: [
          {
            description: 'Produit Test',
            quantity: 2,
            unitPriceHT: 500,
            tvaRate: 20,
          },
        ],
        paymentMethod: 'virement',
      }, testUserId);

      expect(result.success).toBe(true);
      expect(result.invoiceNumber).toMatch(/FAC-\d{4}-\d{4}/);
    });

    it('doit incrémenter la séquence', async () => {
      const result1 = await createInvoice({
        companyId: testCompanyId,
        clientId: testClientId,
        type: 'INVOICE',
        items: [{ description: 'Test', quantity: 1, unitPriceHT: 100, tvaRate: 20 }],
      }, testUserId);

      const result2 = await createInvoice({
        companyId: testCompanyId,
        clientId: testClientId,
        type: 'INVOICE',
        items: [{ description: 'Test', quantity: 1, unitPriceHT: 100, tvaRate: 20 }],
      }, testUserId);

      // Les numéros doivent être différents et séquentiels
      expect(result1.invoiceNumber).not.toBe(result2.invoiceNumber);
    });

    it('doit échouer si client inexistant', async () => {
      const result = await createInvoice({
        companyId: testCompanyId,
        clientId: 'invalid-id',
        type: 'INVOICE',
        items: [],
      }, testUserId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Client non trouvé');
    });
  });

  describe('validateInvoice', () => {
    it('doit valider une facture en brouillon', async () => {
      // Créer facture brouillon
      const createResult = await createInvoice({
        companyId: testCompanyId,
        clientId: testClientId,
        type: 'INVOICE',
        items: [{ description: 'Test', quantity: 1, unitPriceHT: 100, tvaRate: 20 }],
      }, testUserId);

      // Récupérer ID facture
      const invoice = await prisma.invoice.findUnique({
        where: { number: createResult.invoiceNumber! },
      });

      // Valider
      const validateResult = await validateInvoice(invoice!.id, testUserId);

      expect(validateResult.success).toBe(true);
      
      // Vérifier statut changé
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice!.id },
      });
      expect(updatedInvoice?.status).toBe('SENT');
      expect(updatedInvoice?.validatedAt).toBeDefined();
    });

    it('doit échouer si facture déjà validée', async () => {
      const createResult = await createInvoice({
        companyId: testCompanyId,
        clientId: testClientId,
        type: 'INVOICE',
        items: [{ description: 'Test', quantity: 1, unitPriceHT: 100, tvaRate: 20 }],
      }, testUserId);

      const invoice = await prisma.invoice.findUnique({
        where: { number: createResult.invoiceNumber! },
      });

      // Première validation
      await validateInvoice(invoice!.id, testUserId);

      // Deuxième validation doit échouer
      const secondValidate = await validateInvoice(invoice!.id, testUserId);

      expect(secondValidate.success).toBe(false);
      expect(secondValidate.error).toContain('déjà validée');
    });
  });

  describe('createCreditNote', () => {
    it('doit créer un avoir lié à facture originale', async () => {
      // Créer et valider facture
      const createResult = await createInvoice({
        companyId: testCompanyId,
        clientId: testClientId,
        type: 'INVOICE',
        items: [{ description: 'Produit', quantity: 2, unitPriceHT: 500, tvaRate: 20 }],
      }, testUserId);

      const invoice = await prisma.invoice.findUnique({
        where: { number: createResult.invoiceNumber! },
        include: { items: true },
      });

      // Créer avoir
      const creditResult = await createCreditNote(
        invoice!.id,
        testUserId,
        'Retour marchandise'
      );

      expect(creditResult.success).toBe(true);
      expect(creditResult.invoiceNumber).toMatch(/AVO-/);

      // Vérifier montants négatifs
      const creditNote = await prisma.invoice.findUnique({
        where: { number: creditResult.invoiceNumber! },
      });

      expect(creditNote?.totalHT).toBe(-invoice!.totalHT);
      expect(creditNote?.totalTVA).toBe(-invoice!.totalTVA);
      expect(creditNote?.totalTTC).toBe(-invoice!.totalTTC);
      expect(creditNote?.originalInvoiceId).toBe(invoice!.id);
    });
  });

  describe('recordPayment', () => {
    it('doit enregistrer paiement et mettre à jour statut', async () => {
      const createResult = await createInvoice({
        companyId: testCompanyId,
        clientId: testClientId,
        type: 'INVOICE',
        items: [{ description: 'Test', quantity: 1, unitPriceHT: 1000, tvaRate: 20 }],
      }, testUserId);

      const invoice = await prisma.invoice.findUnique({
        where: { number: createResult.invoiceNumber! },
      });

      // Payer intégralement
      const paymentResult = await recordPayment(
        invoice!.id,
        invoice!.totalTTC,
        'virement',
        'VIR-2025-001',
        undefined,
        testUserId
      );

      expect(paymentResult.success).toBe(true);

      // Vérifier mise à jour
      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice!.id },
      });

      expect(updatedInvoice?.status).toBe('PAID');
      expect(updatedInvoice?.amountPaid).toBe(invoice!.totalTTC);
      expect(updatedInvoice?.remainingAmount).toBe(0);
    });

    it('doit gérer paiement partiel', async () => {
      const createResult = await createInvoice({
        companyId: testCompanyId,
        clientId: testClientId,
        type: 'INVOICE',
        items: [{ description: 'Test', quantity: 1, unitPriceHT: 1000, tvaRate: 20 }],
      }, testUserId);

      const invoice = await prisma.invoice.findUnique({
        where: { number: createResult.invoiceNumber! },
      });

      // Payer 50%
      await recordPayment(
        invoice!.id,
        invoice!.totalTTC / 2,
        'cheque',
        'CHQ-123456',
        'Attijariwafa Bank',
        testUserId
      );

      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice!.id },
      });

      expect(updatedInvoice?.status).toBe('PARTIAL');
      expect(updatedInvoice?.remainingAmount).toBeGreaterThan(0);
    });
  });
});
```

---

## 3. Tests API (E2E)

### Configuration Supertest

```bash
npm install --save-dev supertest @types/supertest
```

`src/app/api/invoices/__tests__/route.test.ts`:

```typescript
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { generateJwtToken } from '@/middleware/auth';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

describe('API Invoices - Tests E2E', () => {
  let authToken: string;
  let testCompanyId: string;
  let testClientId: string;

  beforeAll(async () => {
    // Setup données test
    const tenant = await prisma.tenant.create({
      data: { name: 'Test', slug: 'test-e2e' },
    });

    const company = await prisma.company.create({
      data: {
        tenantId: tenant.id,
        name: 'Company E2E',
        address: 'Address',
        city: 'City',
        ice: '123456789012345',
        if: '12345678',
        rc: '123456',
      },
    });
    testCompanyId = company.id;

    const client = await prisma.client.create({
      data: {
        companyId: company.id,
        name: 'Client E2E',
        address: 'Address',
        city: 'City',
        type: 'entreprise',
      },
    });
    testClientId = client.id;

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'e2e@test.com',
        passwordHash: 'hash',
        role: 'COMPTABLE',
      },
    });

    authToken = await generateJwtToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
    });
  });

  describe('POST /api/invoices', () => {
    it('doit créer une facture (201)', async () => {
      const response = await request(BASE_URL)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          clientId: testClientId,
          type: 'INVOICE',
          items: [
            {
              description: 'Service consulting',
              quantity: 5,
              unitPriceHT: 1000,
              tvaRate: 20,
            },
          ],
          paymentMethod: 'virement',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.number).toMatch(/FAC-\d{4}-\d{4}/);
      expect(response.body.data.totalTTC).toBe(6000); // 5000 + 1000 TVA
    });

    it('doit rejeter sans authentification (401)', async () => {
      const response = await request(BASE_URL)
        .post('/api/invoices')
        .send({});

      expect(response.status).toBe(401);
    });

    it('doit rejeter avec rôle insuffisant (403)', async () => {
      // Créer token MAGASINIER (pas droit création facture)
      const tenant = await prisma.tenant.findFirst();
      const user = await prisma.user.create({
        data: {
          tenantId: tenant!.id,
          email: 'magasinier@test.com',
          passwordHash: 'hash',
          role: 'MAGASINIER',
        },
      });

      const token = await generateJwtToken({
        id: user.id,
        email: user.email,
        role: 'MAGASINIER',
        tenantId: tenant!.id,
      });

      const response = await request(BASE_URL)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/invoices/:id/pdf', () => {
    it('doit générer PDF facture', async () => {
      // Créer facture d'abord
      const createResponse = await request(BASE_URL)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          companyId: testCompanyId,
          clientId: testClientId,
          type: 'INVOICE',
          items: [{ description: 'Test', quantity: 1, unitPriceHT: 100, tvaRate: 20 }],
        });

      const invoiceId = createResponse.body.data.id;

      const response = await request(BASE_URL)
        .get(`/api/invoices/${invoiceId}/pdf`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });
});
```

---

## 4. Tests de Conformité

### Validation Mentions Légales PDF

`src/services/__tests__/pdf-compliance.test.ts`:

```typescript
import { InvoicePDF } from '../pdf-generator';
import { renderToStream } from '@react-pdf/renderer';

describe('PDF Compliance - Mentions légales obligatoires', () => {
  
  const mockInvoiceData = {
    number: 'FAC-2025-0001',
    type: 'INVOICE',
    status: 'SENT',
    issueDate: new Date(),
    company: {
      name: 'Société Test SARL',
      legalForm: 'SARL',
      address: '123 Avenue Mohammed V',
      city: 'Casablanca',
      postalCode: '20000',
      ice: '123456789012345',
      if: '12345678',
      rc: '123456',
      pat: '12345678',
      mf: '123456789012345',
    },
    client: {
      name: 'Client SA',
      type: 'entreprise',
      address: '456 Boulevard Hassan II',
      city: 'Rabat',
      ice: '987654321098765',
      if: '87654321',
      rc: '654321',
    },
    items: [{
      description: 'Produit Test',
      quantity: 2,
      unitPriceHT: 500,
      tvaRate: 20,
      totalHT: 1000,
      tvaAmount: 200,
      totalTTC: 1200,
    }],
    subtotalHT: 1000,
    discountAmount: 0,
    totalHT: 1000,
    totalTVA: 200,
    timbreFiscal: 0,
    totalTTC: 1200,
    amountPaid: 0,
    remainingAmount: 1200,
  };

  it('doit inclure toutes les mentions légales vendeur', async () => {
    const doc = <InvoicePDF data={mockInvoiceData} />;
    const stream = await renderToStream(doc);
    
    // Extraire texte du PDF (avec pdf-parse par exemple)
    // Vérifier présence ICE, IF, RC, Patente, MF
    // ... implémentation avec pdf-parse
  });

  it('doit afficher numéro facture séquentiel', async () => {
    const doc = <InvoicePDF data={mockInvoiceData} />;
    // Vérifier format FAC-ANNEE-SEQUENCE
  });

  it('doit afficher détail TVA par taux', async () => {
    // Avec multiple taux TVA
    const multiTvaData = {
      ...mockInvoiceData,
      items: [
        { description: 'Produit 20%', quantity: 1, unitPriceHT: 100, tvaRate: 20, totalHT: 100, tvaAmount: 20, totalTTC: 120 },
        { description: 'Produit 14%', quantity: 1, unitPriceHT: 100, tvaRate: 14, totalHT: 100, tvaAmount: 14, totalTTC: 114 },
      ],
    };
    // Vérifier détail dans PDF
  });

  it('doit mentionner timbre fiscal si applicable', async () => {
    const withTimbreData = {
      ...mockInvoiceData,
      timbreFiscal: 50,
      totalTTC: 1250,
    };
    // Vérifier mention "Timbre fiscal - Article 142 CGI"
  });
});
```

---

## 5. Tests de Charge & Performance

### K6 Load Testing

`tests/load/invoices.load.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up
    { duration: '1m', target: 50 },   // Sustained load
    { duration: '30s', target: 100 }, // Peak
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% < 500ms
    errors: ['rate<0.01'],            // < 1% errors
  },
};

export default function () {
  const token = __ENV.AUTH_TOKEN;
  const payload = JSON.stringify({
    companyId: 'test-company',
    clientId: 'test-client',
    type: 'INVOICE',
    items: [{ description: 'Load Test', quantity: 1, unitPriceHT: 100, tvaRate: 20 }],
  });

  const res = http.post('http://localhost:3000/api/invoices', payload, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const success = check(res, {
    'status is 201': (r) => r.status === 201,
    'has invoice number': (r) => JSON.parse(r.body).data.number !== undefined,
  });

  errorRate.add(!success);
  sleep(1);
}
```

Exécution:

```bash
k6 run --env AUTH_TOKEN=your_token tests/load/invoices.load.js
```

---

## 6. Checklist Validation Finale

### Avant Mise en Production

- [ ] Tous tests unitaires passants (>90% coverage)
- [ ] Tests intégration passants
- [ ] Tests API E2E passants
- [ ] Tests conformité PDF validés
- [ ] Tests charge OK (performance)
- [ ] Audit sécurité (OWASP Top 10)
- [ ] Validation expert-comptable mentions légales
- [ ] Test numérotation concurrente (10 créations simultanées)
- [ ] Test immutabilité factures validées
- [ ] Test journal d'audit (toutes actions loguées)
- [ ] Test backups/restores
- [ ] Test RBAC (tous rôles)
- [ ] Test exports DGI

### Scenarios Critiques à Tester

1. **Création concurrente de factures** (éviter doublons numérotation)
2. **Validation facture avec stock insuffisant**
3. **Création avoir sur facture déjà payée**
4. **Modification facture après validation** (doit être bloqué)
5. **Suppression facture** (seulement brouillons)
6. **Changement d'année** (reset séquence)
7. **Calcul TVA avec multiples taux**
8. **Timbre fiscal espèces vs autres méthodes**

---

## 7. Exécution des Tests

```bash
# Tests unitaires
npm test

# Tests avec coverage
npm test -- --coverage

# Tests d'intégration
npm run test:integration

# Tests E2E (nécessite serveur running)
npm run test:e2e

# Tests de charge
k6 run tests/load/invoices.load.js

# Validation complète
npm run test:all
```

---

**Document de stratégie de test - Version 1.0**  
*Conforme aux standards de qualité pour applications financières*
