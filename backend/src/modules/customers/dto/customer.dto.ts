import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean, IsNumber, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty({ message: 'Type de client requis' })
  type: string; // PROFESSIONAL ou INDIVIDUAL

  // Informations professionnelles
  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  ice?: string; // Obligatoire pour les professionnels

  @IsString()
  @IsOptional()
  rc?: string;

  @IsString()
  @IsOptional()
  if?: string;

  @IsString()
  @IsOptional()
  patente?: string;

  // Informations personnelles
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  cin?: string; // Carte d'Identité Nationale (chiffré)

  // Contact
  @IsEmail({}, { message: 'Email invalide' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string = 'MA';

  // Commercial
  @IsNumber()
  @IsOptional()
  creditLimit?: number = 0;

  @IsNumber()
  @IsOptional()
  paymentTerms?: number = 30;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateCustomerDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  ice?: string;

  @IsString()
  @IsOptional()
  rc?: string;

  @IsString()
  @IsOptional()
  if?: string;

  @IsString()
  @IsOptional()
  patente?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  cin?: string;

  @IsEmail({}, { message: 'Email invalide' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  @IsOptional()
  creditLimit?: number;

  @IsNumber()
  @IsOptional()
  paymentTerms?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
