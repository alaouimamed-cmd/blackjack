/**
 * Middleware d'authentification et RBAC (Role-Based Access Control)
 * 
 * Rôles définis:
 * - ADMIN: Accès total (configuration, utilisateurs)
 * - DIRECTEUR: Validation, reporting, accès complet sauf config système
 * - COMPTABLE: Factures, avoirs, déclarations fiscales
 * - COMMERCIAL: Devis, clients, factures (lecture)
 * - MAGASINIER: Produits, stock, mouvements
 * - AUDITEUR: Lecture seule, logs d'audit
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Clé secrète pour JWT (à mettre dans .env)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'change-this-secret-in-production'
);

export enum UserRole {
  ADMIN = 'ADMIN',
  DIRECTEUR = 'DIRECTEUR',
  COMPTABLE = 'COMPTABLE',
  COMMERCIAL = 'COMMERCIAL',
  MAGASINIER = 'MAGASINIER',
  AUDITEUR = 'AUDITEUR',
}

// Matrice de permissions par rôle
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: ['*'], // Tous les droits
  
  [UserRole.DIRECTEUR]: [
    'invoice:read',
    'invoice:write',
    'invoice:validate',
    'client:read',
    'client:write',
    'product:read',
    'supplier:read',
    'supplier:write',
    'report:read',
    'report:export',
    'user:read',
  ],
  
  [UserRole.COMPTABLE]: [
    'invoice:read',
    'invoice:write',
    'invoice:validate',
    'credit_note:create',
    'payment:record',
    'client:read',
    'client:write',
    'product:read',
    'supplier:read',
    'report:read',
    'report:export',
    'tax:declare',
  ],
  
  [UserRole.COMMERCIAL]: [
    'quote:read',
    'quote:write',
    'invoice:read',
    'invoice:write',
    'client:read',
    'client:write',
    'product:read',
  ],
  
  [UserRole.MAGASINIER]: [
    'product:read',
    'product:write',
    'stock:read',
    'stock:write',
    'stock_movement:create',
    'supplier:read',
  ],
  
  [UserRole.AUDITEUR]: [
    'invoice:read',
    'client:read',
    'product:read',
    'supplier:read',
    'audit_log:read',
    'report:read',
  ],
};

// Interfaces
export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  tenantId: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  auth?: {
    user: JwtPayload;
  };
}

/**
 * Vérifie le token JWT et attache l'utilisateur à la requête
 */
export async function authenticateRequest(
  request: NextRequest
): Promise<{ authenticated: boolean; user?: JwtPayload; error?: string }> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authenticated: false, error: 'Token manquant' };
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    const user: JwtPayload = {
      userId: payload.sub!,
      email: payload.email as string,
      role: payload.role as UserRole,
      tenantId: payload.tenantId as string,
    };

    return { authenticated: true, user };
  } catch (error) {
    return { 
      authenticated: false, 
      error: 'Token invalide ou expiré' 
    };
  }
}

/**
 * Middleware pour protéger une route API
 * Vérifie l'authentification ET les permissions
 */
export function requireAuth(requiredPermissions: string[] = []) {
  return async function authMiddleware(
    request: NextRequest,
    handler: (request: AuthenticatedRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Authentification
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Vérification des permissions
    const user = authResult.user!;
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Admin a tous les droits
    if (!userPermissions.includes('*')) {
      const hasPermission = requiredPermissions.every(perm => 
        userPermissions.includes(perm)
      );
      
      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Permissions insuffisantes' },
          { status: 403 }
        );
      }
    }

    // Attacher l'user à la requête
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.auth = { user };

    return handler(authenticatedRequest);
  };
}

/**
 * Middleware spécifique par type de ressource
 */
export const invoicePermissions = {
  read: ['invoice:read'],
  write: ['invoice:write'],
  validate: ['invoice:validate'],
  delete: ['invoice:delete'], // Réservé aux brouillons uniquement
};

export const clientPermissions = {
  read: ['client:read'],
  write: ['client:write'],
};

export const productPermissions = {
  read: ['product:read'],
  write: ['product:write'],
};

/**
 * Helper pour vérifier si un utilisateur peut modifier une facture
 * (seulement si statut DRAFT)
 */
export function canModifyInvoice(status: string): boolean {
  return status === 'DRAFT';
}

/**
 * Helper pour vérifier si un utilisateur peut valider une facture
 */
export function canValidateInvoice(role: UserRole): boolean {
  return [
    UserRole.ADMIN,
    UserRole.DIRECTEUR,
    UserRole.COMPTABLE,
  ].includes(role);
}

/**
 * Génère un token JWT pour un utilisateur
 */
export async function generateJwtToken(user: {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
}): Promise<string> {
  const { SignJWT } = await import('jose');
  
  return new SignJWT({
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

/**
 * Middleware Next.js pour protéger toutes les routes /api
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  
  // Routes publiques (login, register)
  const publicRoutes = ['/api/auth/login', '/api/auth/register'];
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Toutes les routes API nécessitent authentification
  if (pathname.startsWith('/api/')) {
    const authResult = await authenticateRequest(request);
    
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
  }
  
  return NextResponse.next();
}
