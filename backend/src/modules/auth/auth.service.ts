import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(email: string, password: string, firstName: string, lastName: string, role: string) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS') || '10');
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as any,
      },
    });

    // Générer les tokens
    const tokens = await this.generateTokens(user.id, email);

    // Créer la session
    await this.createSession(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string, ipAddress?: string, userAgent?: string) {
    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé. Contactez l\'administrateur.');
    }

    // Vérifier le mot de passe
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Mettre à jour lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Générer les tokens
    const tokens = await this.generateTokens(user.id, email);

    // Créer la session avec IP et User-Agent
    await this.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    // Logger la connexion dans AuditLog
    await this.prisma.auditLog.create({
      data: {
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        ipAddress,
        userAgent,
        metadata: { email },
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      ...tokens,
    };
  }

  async logout(userId: string, refreshToken: string) {
    // Supprimer la session
    await this.prisma.session.deleteMany({
      where: { token: refreshToken },
    });

    // Logger la déconnexion
    await this.prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        entityType: 'USER',
        entityId: userId,
        userId,
        metadata: { refreshToken: refreshToken.substring(0, 10) + '...' },
      },
    });

    return { success: true };
  }

  async refreshTokens(refreshToken: string) {
    // Trouver la session
    const session = await this.prisma.session.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!session) {
      throw new UnauthorizedException('Session invalide');
    }

    // Vérifier si la session est expirée
    if (new Date() > session.expiresAt) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Session expirée');
    }

    // Générer de nouveaux tokens
    const tokens = await this.generateTokens(session.user.id, session.user.email);

    // Mettre à jour la session avec le nouveau refresh token
    await this.prisma.session.update({
      where: { id: session.id },
      data: { token: tokens.refreshToken, expiresAt: tokens.refreshExpiresAt },
    });

    return tokens;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // Vérifier l'ancien mot de passe
    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hasher le nouveau mot de passe
    const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS') || '10');
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Logger le changement
    await this.prisma.auditLog.create({
      data: {
        action: 'PASSWORD_CHANGE',
        entityType: 'USER',
        entityId: userId,
        userId,
      },
    });

    return { success: true };
  }

  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get('JWT_SECRET'),
          expiresIn: this.configService.get('JWT_EXPIRES_IN') || '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: this.configService.get('REFRESH_TOKEN_SECRET'),
          expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
        },
      ),
    ]);

    const refreshExpiresAt = new Date();
    const expiresInSeconds = parseInt(this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '604800');
    refreshExpiresAt.setSeconds(refreshExpiresAt.getSeconds() + expiresInSeconds);

    return {
      accessToken,
      refreshToken,
      refreshExpiresAt,
    };
  }

  private async createSession(userId: string, token: string, ipAddress?: string, userAgent?: string) {
    const expiresAt = new Date();
    const expiresInSeconds = parseInt(this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '604800');
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    await this.prisma.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }
}
