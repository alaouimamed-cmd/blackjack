import { IsEmail, IsNotEmpty, IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mot de passe requis' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Prénom requis' })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Nom requis' })
  lastName: string;

  @IsEnum(UserRole, { message: 'Rôle invalide' })
  @IsOptional()
  role?: UserRole = UserRole.COMMERCIAL;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class UpdateUserDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole, { message: 'Rôle invalide' })
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
