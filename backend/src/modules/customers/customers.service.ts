import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10, search?: string, companyId?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { ice: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          companyName: true,
          ice: true,
          rc: true,
          if: true,
          patente: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          city: true,
          creditLimit: true,
          paymentTerms: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            ice: true,
          },
        },
        documents: {
          take: 5,
          orderBy: { issueDate: 'desc' },
          select: {
            id: true,
            number: true,
            type: true,
            status: true,
            total: true,
            issueDate: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Client avec ID ${id} non trouvé`);
    }

    return customer;
  }

  async create(data: any) {
    // Vérifier ICE unique pour les professionnels
    if (data.ice) {
      const existingIce = await this.prisma.customer.findUnique({
        where: { ice: data.ice },
      });
      if (existingIce) {
        throw new ConflictException('Cet ICE est déjà utilisé par un autre client');
      }
    }

    // Validation: ICE obligatoire pour les professionnels
    if (data.type === 'PROFESSIONAL' && !data.ice) {
      throw new ConflictException('L\'ICE est obligatoire pour les clients professionnels');
    }

    const customer = await this.prisma.customer.create({
      data: {
        ...data,
        consentDate: data.consentDate ? new Date(data.consentDate) : new Date(),
      },
      select: {
        id: true,
        type: true,
        companyName: true,
        ice: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    // Logger la création (CNDP)
    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'CUSTOMER',
        entityId: customer.id,
        metadata: { type: data.type, ice: data.ice },
      },
    });

    return customer;
  }

  async update(id: string, data: any) {
    const existingCustomer = await this.prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      throw new NotFoundException(`Client avec ID ${id} non trouvé`);
    }

    // Vérifier ICE unique si modifié
    if (data.ice && data.ice !== existingCustomer.ice) {
      const iceInUse = await this.prisma.customer.findFirst({
        where: { ice: data.ice, NOT: { id } },
      });
      if (iceInUse) {
        throw new ConflictException('Cet ICE est déjà utilisé par un autre client');
      }
    }

    const customer = await this.prisma.customer.update({
      where: { id },
      data,
      select: {
        id: true,
        type: true,
        companyName: true,
        ice: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        updatedAt: true,
      },
    });

    // Logger la modification (CNDP)
    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'CUSTOMER',
        entityId: id,
        before: { ice: existingCustomer.ice, email: existingCustomer.email },
        after: { ice: customer.ice, email: customer.email },
      },
    });

    return customer;
  }

  async delete(id: string) {
    const existingCustomer = await this.prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      throw new NotFoundException(`Client avec ID ${id} non trouvé`);
    }

    // Vérifier s'il y a des documents liés
    const documentCount = await this.prisma.document.count({
      where: { customerId: id },
    });

    if (documentCount > 0) {
      // Soft delete: désactiver au lieu de supprimer
      const customer = await this.prisma.customer.update({
        where: { id },
        data: { isActive: false },
        select: { id: true, isActive: true },
      });

      await this.prisma.auditLog.create({
        data: {
          action: 'DEACTIVATE',
          entityType: 'CUSTOMER',
          entityId: id,
          metadata: { reason: 'Documents liés existants', documentCount },
        },
      });

      return { ...customer, message: 'Client désactivé (documents liés existants)' };
    }

    // Suppression physique possible (droit CNDP)
    await this.prisma.customer.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'CUSTOMER',
        entityId: id,
        metadata: { reason: 'Demande suppression CNDP' },
      },
    });

    return { success: true, message: 'Client supprimé' };
  }

  async getStats(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const [total, active, professional, individual] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.count({ where: { ...where, isActive: true } }),
      this.prisma.customer.count({ where: { ...where, type: 'PROFESSIONAL' } }),
      this.prisma.customer.count({ where: { ...where, type: 'INDIVIDUAL' } }),
    ]);

    return {
      total,
      active,
      inactive: total - active,
      professional,
      individual,
    };
  }
}
