import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { MovementType } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10, search?: string, categoryId?: string, lowStockOnly?: boolean) {
    const skip = (page - 1) * limit;
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { sku: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (lowStockOnly === 'true') {
      where.currentStock = { lte: this.prisma.product.fields.minStock };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          sku: true,
          name: true,
          description: true,
          salePrice: true,
          vatRate: true,
          currentStock: true,
          reservedStock: true,
          minStock: true,
          maxStock: true,
          averageCost: true,
          valuationMethod: true,
          unit: true,
          barcode: true,
          category: {
            select: { id: true, name: true },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        stockMovements: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            quantity: true,
            unitCost: true,
            totalValue: true,
            reference: true,
            reason: true,
            createdAt: true,
          },
        },
        stockLots: {
          where: { remainingQty: { gt: 0 } },
          orderBy: { receivedAt: 'asc' }, // FIFO
          select: {
            id: true,
            quantity: true,
            remainingQty: true,
            unitCost: true,
            batchNumber: true,
            receivedAt: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Produit avec ID ${id} non trouvé`);
    }

    return product;
  }

  async create(data: any) {
    // Vérifier SKU unique
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      throw new ConflictException('Ce code SKU existe déjà');
    }

    // Calculer le prix TTC
    const tvaRates = {
      EXEMPT: 0,
      REDUCED_1: 0.10,
      REDUCED_2: 0.14,
      STANDARD: 0.20,
      SUSPENDED: 0,
    };
    const tvaRate = tvaRates[data.vatRate || 'STANDARD'];

    const product = await this.prisma.product.create({
      data: {
        ...data,
        currentStock: data.currentStock || 0,
        reservedStock: 0,
        averageCost: data.averageCost || 0,
      },
      select: {
        id: true,
        sku: true,
        name: true,
        salePrice: true,
        vatRate: true,
        currentStock: true,
        createdAt: true,
      },
    });

    // Si stock initial > 0, créer un mouvement d'entrée
    if (data.currentStock && data.currentStock > 0) {
      const unitCost = data.averageCost || 0;
      await this.prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: MovementType.ENTRY,
          quantity: data.currentStock,
          unitCost,
          totalValue: data.currentStock * unitCost,
          reason: 'Stock initial',
          performedBy: 'SYSTEM',
        },
      });

      // Créer un lot de stock
      await this.prisma.stockLot.create({
        data: {
          productId: product.id,
          quantity: data.currentStock,
          remainingQty: data.currentStock,
          unitCost,
          batchNumber: 'INITIAL-' + Date.now(),
        },
      });
    }

    // Logger la création
    await this.prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'PRODUCT',
        entityId: product.id,
        metadata: { sku: data.sku, name: data.name },
      },
    });

    return product;
  }

  async update(id: string, data: any) {
    const existingProduct = await this.prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new NotFoundException(`Produit avec ID ${id} non trouvé`);
    }

    // Vérifier SKU unique si modifié
    if (data.sku && data.sku !== existingProduct.sku) {
      const skuInUse = await this.prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (skuInUse) {
        throw new ConflictException('Ce code SKU est déjà utilisé');
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data,
      select: {
        id: true,
        sku: true,
        name: true,
        salePrice: true,
        vatRate: true,
        minStock: true,
        updatedAt: true,
      },
    });

    // Logger la modification
    await this.prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'PRODUCT',
        entityId: id,
        before: { salePrice: existingProduct.salePrice, minStock: existingProduct.minStock },
        after: { salePrice: product.salePrice, minStock: product.minStock },
      },
    });

    return product;
  }

  async delete(id: string) {
    const existingProduct = await this.prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new NotFoundException(`Produit avec ID ${id} non trouvé`);
    }

    // Soft delete
    const product = await this.prisma.product.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, sku: true, isActive: true },
    });

    await this.prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'PRODUCT',
        entityId: id,
        metadata: { sku: existingProduct.sku },
      },
    });

    return product;
  }

  async adjustStock(productId: string, quantity: number, reason: string, userId: string) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Produit avec ID ${productId} non trouvé`);
    }

    const newStock = product.currentStock + quantity;
    if (newStock < 0) {
      throw new BadRequestException('Stock insuffisant');
    }

    const movementType = quantity > 0 ? MovementType.ENTRY : MovementType.EXIT;
    const absQuantity = Math.abs(quantity);

    // Calculer le coût unitaire pour CMUP
    let unitCost = product.averageCost;
    if (movementType === MovementType.ENTRY && quantity > 0) {
      // Pour une entrée, on utilisera le coût moyen actuel (à améliorer avec coût réel)
      unitCost = product.averageCost;
    }

    const totalValue = absQuantity * unitCost;

    // Créer le mouvement de stock
    const movement = await this.prisma.stockMovement.create({
      data: {
        productId,
        type: movementType,
        quantity: absQuantity,
        unitCost,
        totalValue,
        reason,
        performedBy: userId,
      },
    });

    // Mettre à jour le stock
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        currentStock: newStock,
        // Recalculer CMUP si entrée
        averageCost: movementType === MovementType.ENTRY 
          ? ((product.averageCost * product.currentStock + totalValue) / (product.currentStock + absQuantity))
          : product.averageCost,
      },
    });

    // Logger l'ajustement
    await this.prisma.auditLog.create({
      data: {
        action: 'STOCK_ADJUSTMENT',
        entityType: 'PRODUCT',
        entityId: productId,
        before: { currentStock: product.currentStock },
        after: { currentStock: newStock },
        metadata: { reason, movementId: movement.id },
      },
    });

    return { product: updatedProduct, movement };
  }

  async getLowStockProducts(threshold?: number) {
    const where = threshold 
      ? { currentStock: { lte: threshold }, isActive: true }
      : { isActive: true, currentStock: { lte: this.prisma.product.fields.minStock } };

    return this.prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        currentStock: true,
        minStock: true,
        reservedStock: true,
      },
      orderBy: { currentStock: 'asc' },
    });
  }

  async getStats() {
    const [totalProducts, totalValue, lowStockCount, outOfStockCount] = await Promise.all([
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.product.aggregate({
        where: { isActive: true },
        _sum: { averageCost: true },
      }).then(r => r._sum.averageCost || 0),
      this.prisma.product.count({
        where: { isActive: true, currentStock: { lte: 5 } },
      }),
      this.prisma.product.count({
        where: { isActive: true, currentStock: 0 },
      }),
    ]);

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
    };
  }
}
