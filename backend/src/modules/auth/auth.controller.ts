import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, ChangePasswordDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Roles(UserRole.ADMIN) // Seul un admin peut créer des comptes (optionnel, à adapter)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.firstName,
      registerDto.lastName,
      registerDto.role,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Request() req,
    @Headers('x-forwarded-for') forwardedFor?: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    const ipAddress = forwardedFor || req.ip || req.connection.remoteAddress;
    return this.authService.login(loginDto.email, loginDto.password, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Body() body: RefreshTokenDto, @Request() req) {
    return this.authService.logout(req.user.id, body.refreshToken);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshTokenDto) {
    if (!body.refreshToken) {
      throw new BadRequestException('Refresh token requis');
    }
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(@Body() dto: ChangePasswordDto, @Request() req) {
    return this.authService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
