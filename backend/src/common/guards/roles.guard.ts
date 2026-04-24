import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Pas de restriction de rôle
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Récupérer le rôle de l'utilisateur depuis la DB
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ForbiddenException('Utilisateur non trouvé');
    }

    // Vérifier si le rôle de l'utilisateur est dans la liste des rôles requis
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        `Accès refusé. Rôle requis: ${requiredRoles.join(', ')}. Votre rôle: ${user.role}`,
      );
    }

    return true;
  }
}
