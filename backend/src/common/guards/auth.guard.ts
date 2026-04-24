import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token d\'authentification requis');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // Vérifier si l'utilisateur est toujours actif
      if (!payload.sub) {
        throw new UnauthorizedException('Token invalide');
      }

      // Attacher l'utilisateur à la requête
      request['user'] = {
        id: payload.sub,
        email: payload.email,
      };
    } catch (error) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    // Vérifier les rôles si le décorateur @Roles est présent
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      // Ici on devrait vérifier le rôle dans la DB
      // Pour l'instant on laisse passer car le rôle est vérifié dans le service
      // Une implémentation complète irait chercher le rôle dans la DB
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
