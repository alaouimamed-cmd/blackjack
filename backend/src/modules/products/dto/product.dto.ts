import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsEnum, Min, IsDecimal } from 'class-validator';
import { VatRate, ValuationMethod } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Code SKU requis' })
  sku: string;

  @IsString()
  @IsNotEmpty({ message: 'Nom du produit requis' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber({}, { message: 'Prix de vente HT requis' })
  @Min(0, { message: 'Le prix ne peut pas être négatif' })
  salePrice: number;

  @IsEnum(VatRate, { message: 'Taux TVA invalide' })
  @IsOptional()
  vatRate?: VatRate = VatRate.STANDARD;

  @IsBoolean()
  @IsOptional()
  isExempt?: boolean = false;

  @IsNumber({}, { message: 'Stock initial invalide' })
  @Min(0)
  @IsOptional()
  currentStock?: number = 0;

  @IsNumber({}, { message: 'Seuil d\'alerte invalide' })
  @Min(0)
  @IsOptional()
  minStock?: number = 0;

  @IsNumber({}, { message: 'Stock max invalide' })
  @Min(0)
  @IsOptional()
  maxStock?: number = 0;

  @IsEnum(ValuationMethod, { message: 'Méthode de valorisation invalide' })
  @IsOptional()
  valuationMethod?: ValuationMethod = ValuationMethod.CMUP;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  unit?: string = 'PIECE';

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsNumber({}, { message: 'Prix de vente HT requis' })
  @Min(0)
  @IsOptional()
  salePrice?: number;

  @IsEnum(VatRate, { message: 'Taux TVA invalide' })
  @IsOptional()
  vatRate?: VatRate;

  @IsBoolean()
  @IsOptional()
  isExempt?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  maxStock?: number;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class StockAdjustmentDto {
  @IsNumber({}, { message: 'Quantité requise' })
  quantity: number;

  @IsString()
  @IsNotEmpty({ message: 'Motif requis' })
  reason: string;
}
