import {
  Injectable, UnauthorizedException,
  BadRequestException, ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from 'src/users/entities/user.entity';
import { LoginLog, LoginStatus } from './entities/login-log.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(LoginLog)
    private readonly logsRepo: Repository<LoginLog>,
    @InjectRepository(PasswordReset)
    private readonly resetRepo: Repository<PasswordReset>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailer: MailerService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────
  async login(dto: LoginDto, ip: string, userAgent: string) {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email },
      relations: { role: { permissions: true }, permissions: true },
      withDeleted: false,
    });

    // Email inconnu → même message générique (ne pas révéler l'existence)
    if (!user) {
      await this.recordLog(null, dto.email, ip, userAgent, LoginStatus.FAILED);
      throw new UnauthorizedException('Identifiants invalides');
    }

    // Compte désactivé par un admin
    if (!user.isActive) {
      await this.recordLog(user, dto.email, ip, userAgent, LoginStatus.BLOCKED);
      throw new ForbiddenException('Compte désactivé. Contactez votre administrateur.');
    }

    // Compte temporairement verrouillé (brute-force)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
      await this.recordLog(user, dto.email, ip, userAgent, LoginStatus.BLOCKED);
      throw new ForbiddenException(
        `Trop de tentatives. Compte verrouillé pendant ${minutes} minute(s).`
      );
    }

    // Vérification du mot de passe
    const isValid = await bcrypt.compare(dto.password, user.password);

    if (!isValid) {
      await this.handleFailedAttempt(user);
      await this.recordLog(user, dto.email, ip, userAgent, LoginStatus.FAILED);
      const remaining = Math.max(0, 5 - (user.failedAttempts + 1));
      throw new UnauthorizedException(
        remaining > 0
          ? `Identifiants invalides. ${remaining} tentative(s) restante(s).`
          : 'Identifiants invalides. Compte verrouillé 15 minutes.'
      );
    }

    // ✅ Connexion réussie
    await this.usersRepo.update(user.id, {
      failedAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    });
    await this.recordLog(user, dto.email, ip, userAgent, LoginStatus.SUCCESS);

    return this.buildTokens(user);
  }

  // ─────────────────────────────────────────────────────────────────
  // PROTECTION BRUTE-FORCE
  // ─────────────────────────────────────────────────────────────────
  private async handleFailedAttempt(user: User): Promise<void> {
    const newCount = user.failedAttempts + 1;
    const lockedUntil = newCount >= 5
      ? new Date(Date.now() + 15 * 60 * 1000)  // Verrouillage 15 min
      : null;

    await this.usersRepo.update(user.id, {
      failedAttempts: newCount,
      lockedUntil,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // GÉNÉRATION DES TOKENS (DUAL-TOKEN)
  // ─────────────────────────────────────────────────────────────────
  buildTokens(user: User) {
    // Fusionner permissions du rôle + permissions individuelles
    const rolePerms = user.role?.permissions?.map((p) => p.nom) ?? [];
    const userPerms = user.permissions?.map((p) => p.nom) ?? [];
    const allPermissions = [...new Set([...rolePerms, ...userPerms])];

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role?.nom,
      permissions: allPermissions,
    };

    // Access token : courte durée (15 min)
    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES'),
    });

    // Refresh token : longue durée (7 jours), stocké en cookie httpOnly
    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES'),
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role?.label,
        permissions: allPermissions,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────────────────────────
  async refresh(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { id: userId, isActive: true },
      relations: { role: { permissions: true }, permissions: true },
    });

    if (!user) throw new UnauthorizedException('Session invalide ou expirée');

    return this.buildTokens(user);
  }

  // ─────────────────────────────────────────────────────────────────
  // PROFIL COURANT
  // ─────────────────────────────────────────────────────────────────
  async getProfile(userId: number) {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: { role: { permissions: true }, permissions: true },
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const rolePerms = user.role?.permissions?.map((p) => p.nom) ?? [];
    const userPerms = user.permissions?.map((p) => p.nom) ?? [];

    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      role: user.role?.label,
      permissions: [...new Set([...rolePerms, ...userPerms])],
      lastLoginAt: user.lastLoginAt,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // RESET MOT DE PASSE — ENVOI EMAIL
  // ─────────────────────────────────────────────────────────────────
  async sendResetLink(email: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { email } });

    // Ne rien révéler si l'email n'existe pas
    if (!user) return;

    // Invalider les anciens tokens non utilisés
    await this.resetRepo
      .createQueryBuilder()
      .update()
      .set({ usedAt: new Date() })
      .where('user_id = :userId AND used_at IS NULL', { userId: user.id })
      .execute();

    // Créer un nouveau token (UUID + hash)
    const rawToken = uuidv4();
    const hashedToken = await bcrypt.hash(rawToken, 10);

    const reset = this.resetRepo.create({
      user,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),  // +1 heure
    });
    await this.resetRepo.save(reset);

    // Envoyer l'email
    const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${rawToken}&id=${reset.id}`;

    await this.mailer.sendMail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe ERP',
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Bonjour ${user.prenom},</p>
        <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
        <a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none">
          Réinitialiser mon mot de passe
        </a>
        <p><small>Ce lien expire dans 1 heure.</small></p>
        <p><small>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</small></p>
      `,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // RESET MOT DE PASSE — VALIDATION
  // ─────────────────────────────────────────────────────────────────
  async resetPassword(resetId: number, rawToken: string, newPassword: string) {
    const reset = await this.resetRepo.findOne({
      where: { id: resetId },
      relations: { user: true },
    });

    if (!reset) throw new BadRequestException('Lien invalide ou expiré');
    if (reset.usedAt) throw new BadRequestException('Ce lien a déjà été utilisé');
    if (reset.expiresAt < new Date()) throw new BadRequestException('Lien expiré');
    if (reset.attempts >= 3) throw new BadRequestException('Trop de tentatives');

    const isValid = await bcrypt.compare(rawToken, reset.token);

    if (!isValid) {
      await this.resetRepo.increment({ id: resetId }, 'attempts', 1);
      throw new BadRequestException('Lien invalide');
    }

    // Hasher le nouveau mot de passe
    const hashed = await bcrypt.hash(newPassword, 12);

    await this.usersRepo.update(reset.user.id, {
      password: hashed,
      passwordChangedAt: new Date(),
      failedAttempts: 0,
      lockedUntil: null,
    });

    await this.resetRepo.update(resetId, { usedAt: new Date() });

    return { message: 'Mot de passe mis à jour avec succès' };
  }

  // ─────────────────────────────────────────────────────────────────
  // CHANGER SON MOT DE PASSE (connecté)
  // ─────────────────────────────────────────────────────────────────
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) throw new UnauthorizedException('Ancien mot de passe incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.usersRepo.update(userId, {
      password: hashed,
      passwordChangedAt: new Date(),
    });

    return { message: 'Mot de passe modifié avec succès' };
  }

  // ─────────────────────────────────────────────────────────────────
  // HISTORIQUE DES CONNEXIONS
  // ─────────────────────────────────────────────────────────────────
  async getLoginHistory(userId: number) {
    return this.logsRepo.find({
      where: { user: { id: userId } },
      order: { loggedAt: 'DESC' },
      take: 50,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // HELPER — Enregistrer un log
  // ─────────────────────────────────────────────────────────────────
  private async recordLog(
    user: User | null,
    email: string,
    ip: string,
    userAgent: string,
    status: LoginStatus,
  ): Promise<void> {
    const log = this.logsRepo.create({
      user,
      email,
      ipAddress: ip,
      userAgent,
      status,
    });
    await this.logsRepo.save(log);
  }
}