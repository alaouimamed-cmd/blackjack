import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;
    const where = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        auditLogs: {
          take: 10,
          orderBy: { timestamp: 'desc' },
          select: {
            action: true,
            entityType: true,
            timestamp: true,
            ipAddress: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec ID ${id} non trouvé`);
    }

    return user;
  }

  async create(data: any) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS') || '10');
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive ?? true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Logger la création
    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'USER',
        entityId: user.id,
        metadata: { email: data.email, role: data.role },
      },
    });

    return user;
  }

  async update(id: string, data: any) {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Utilisateur avec ID ${id} non trouvé`);
    }

    // Vérifier si le nouvel email n'est pas déjà utilisé
    if (data.email && data.email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailInUse) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Mettre à jour
    const updateData: any = { ...data };
    delete updateData.password; // Le mot de passe ne peut pas être modifié ici

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // Logger la modification
    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'USER',
        entityId: id,
        before: { email: existingUser.email, role: existingUser.role },
        after: { email: user.email, role: user.role },
      },
    });

    return user;
  }

  async delete(id: string) {
    // Vérifier si l'utilisateur existe
    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      throw new NotFoundException(`Utilisateur avec ID ${id} non trouvé`);
    }

    // On ne supprime pas physiquement, on désactive (soft delete pour conformité)
    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    });

    // Logger la suppression
    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'USER',
        entityId: id,
        before: { isActive: true },
        after: { isActive: false },
      },
    });

    return user;
  }

  async changePassword(id: string, newPassword: string) {
    const saltRounds = parseInt(this.configService.get('BCRYPT_ROUNDS') || '10');
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'PASSWORD_CHANGE',
        entityType: 'USER',
        entityId: id,
      },
    });

    return { success: true };
  }
}
