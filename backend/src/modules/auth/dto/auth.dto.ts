import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mot de passe requis' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
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
}

export class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  @IsNotEmpty({ message: 'Email requis' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mot de passe requis' })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Mot de passe actuel requis' })
  currentPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'Nouveau mot de passe requis' })
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token requis' })
  refreshToken: string;
}
