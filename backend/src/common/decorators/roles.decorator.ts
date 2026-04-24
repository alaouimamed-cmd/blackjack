import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Décorateur pour restreindre l'accès à certains rôles
 * @param roles Tableau de rôles autorisés (UserRole)
 * 
 * @example
 * @Roles(UserRole.ADMIN, UserRole.COMPTABLE)
 * @Get('sensitive-data')
 * getSensitiveData() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
