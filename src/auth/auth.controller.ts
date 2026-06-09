import {
  Controller, Post, Get, Body, Patch,
  Req, Res, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,                           // Non accessible en JavaScript
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,         // 7 jours en ms
  path: '/api/auth/refresh',               // Cookie envoyé SEULEMENT sur cette route
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })  // 5 tentatives/min
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
    const ua = req.headers['user-agent'] || '';

    const { accessToken, refreshToken, user } =
      await this.authService.login(dto, ip, ua);

    // Stocker le refresh token en cookie httpOnly sécurisé
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    // Retourner seulement l'access token et le profil
    return { accessToken, user };
  }

  // POST /api/auth/logout
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
    return { message: 'Déconnecté avec succès' };
  }

  // POST /api/auth/refresh
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  async refresh(
    @CurrentUser() user: { id: number },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.refresh(user.id);

    // Renouveler aussi le cookie refresh
    res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);

    return { accessToken };
  }

  // GET /api/auth/me
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: { id: number }) {
    return this.authService.getProfile(user.id);
  }

  // POST /api/auth/forgot-password
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 3 } })   // 3 demandes/min
  async forgotPassword(@Body('email') email: string) {
    // Toujours répondre 200 (ne pas révéler si l'email existe)
    this.authService.sendResetLink(email).catch(console.error);
    return { message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' };
  }

  // POST /api/auth/reset-password
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto & { resetId: number }) {
    return this.authService.resetPassword(dto.resetId, dto.token, dto.password);
  }

  // PATCH /api/auth/password
  @Patch('password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: { id: number },
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      user.id, body.oldPassword, body.newPassword
    );
  }

  // GET /api/auth/logs
  @Get('logs')
  @UseGuards(JwtAuthGuard)
  getLogs(@CurrentUser() user: { id: number }) {
    return this.authService.getLoginHistory(user.id);
  }
}