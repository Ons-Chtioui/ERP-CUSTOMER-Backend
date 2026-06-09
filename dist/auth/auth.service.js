"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const mailer_1 = require("@nestjs-modules/mailer");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const user_entity_1 = require("../users/entities/user.entity");
const login_log_entity_1 = require("./entities/login-log.entity");
const password_reset_entity_1 = require("./entities/password-reset.entity");
let AuthService = class AuthService {
    usersRepo;
    logsRepo;
    resetRepo;
    jwtService;
    config;
    mailer;
    constructor(usersRepo, logsRepo, resetRepo, jwtService, config, mailer) {
        this.usersRepo = usersRepo;
        this.logsRepo = logsRepo;
        this.resetRepo = resetRepo;
        this.jwtService = jwtService;
        this.config = config;
        this.mailer = mailer;
    }
    async login(dto, ip, userAgent) {
        const user = await this.usersRepo.findOne({
            where: { email: dto.email },
            relations: { role: { permissions: true }, permissions: true },
            withDeleted: false,
        });
        if (!user) {
            await this.recordLog(null, dto.email, ip, userAgent, login_log_entity_1.LoginStatus.FAILED);
            throw new common_1.UnauthorizedException('Identifiants invalides');
        }
        if (!user.isActive) {
            await this.recordLog(user, dto.email, ip, userAgent, login_log_entity_1.LoginStatus.BLOCKED);
            throw new common_1.ForbiddenException('Compte désactivé. Contactez votre administrateur.');
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
            await this.recordLog(user, dto.email, ip, userAgent, login_log_entity_1.LoginStatus.BLOCKED);
            throw new common_1.ForbiddenException(`Trop de tentatives. Compte verrouillé pendant ${minutes} minute(s).`);
        }
        const isValid = await bcrypt.compare(dto.password, user.password);
        if (!isValid) {
            await this.handleFailedAttempt(user);
            await this.recordLog(user, dto.email, ip, userAgent, login_log_entity_1.LoginStatus.FAILED);
            const remaining = Math.max(0, 5 - (user.failedAttempts + 1));
            throw new common_1.UnauthorizedException(remaining > 0
                ? `Identifiants invalides. ${remaining} tentative(s) restante(s).`
                : 'Identifiants invalides. Compte verrouillé 15 minutes.');
        }
        await this.usersRepo.update(user.id, {
            failedAttempts: 0,
            lockedUntil: null,
            lastLoginAt: new Date(),
        });
        await this.recordLog(user, dto.email, ip, userAgent, login_log_entity_1.LoginStatus.SUCCESS);
        return this.buildTokens(user);
    }
    async handleFailedAttempt(user) {
        const newCount = user.failedAttempts + 1;
        const lockedUntil = newCount >= 5
            ? new Date(Date.now() + 15 * 60 * 1000)
            : null;
        await this.usersRepo.update(user.id, {
            failedAttempts: newCount,
            lockedUntil,
        });
    }
    buildTokens(user) {
        const rolePerms = user.role?.permissions?.map((p) => p.nom) ?? [];
        const userPerms = user.permissions?.map((p) => p.nom) ?? [];
        const allPermissions = [...new Set([...rolePerms, ...userPerms])];
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role?.nom,
            permissions: allPermissions,
        };
        const accessToken = this.jwtService.sign(payload, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_EXPIRES'),
        });
        const refreshToken = this.jwtService.sign({ sub: user.id }, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES'),
        });
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
    async refresh(userId) {
        const user = await this.usersRepo.findOne({
            where: { id: userId, isActive: true },
            relations: { role: { permissions: true }, permissions: true },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Session invalide ou expirée');
        return this.buildTokens(user);
    }
    async getProfile(userId) {
        const user = await this.usersRepo.findOne({
            where: { id: userId },
            relations: { role: { permissions: true }, permissions: true },
        });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
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
    async sendResetLink(email) {
        const user = await this.usersRepo.findOne({ where: { email } });
        if (!user)
            return;
        await this.resetRepo
            .createQueryBuilder()
            .update()
            .set({ usedAt: new Date() })
            .where('user_id = :userId AND used_at IS NULL', { userId: user.id })
            .execute();
        const rawToken = (0, uuid_1.v4)();
        const hashedToken = await bcrypt.hash(rawToken, 10);
        const reset = this.resetRepo.create({
            user,
            token: hashedToken,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });
        await this.resetRepo.save(reset);
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
    async resetPassword(resetId, rawToken, newPassword) {
        const reset = await this.resetRepo.findOne({
            where: { id: resetId },
            relations: { user: true },
        });
        if (!reset)
            throw new common_1.BadRequestException('Lien invalide ou expiré');
        if (reset.usedAt)
            throw new common_1.BadRequestException('Ce lien a déjà été utilisé');
        if (reset.expiresAt < new Date())
            throw new common_1.BadRequestException('Lien expiré');
        if (reset.attempts >= 3)
            throw new common_1.BadRequestException('Trop de tentatives');
        const isValid = await bcrypt.compare(rawToken, reset.token);
        if (!isValid) {
            await this.resetRepo.increment({ id: resetId }, 'attempts', 1);
            throw new common_1.BadRequestException('Lien invalide');
        }
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
    async changePassword(userId, oldPassword, newPassword) {
        const user = await this.usersRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('Utilisateur introuvable');
        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid)
            throw new common_1.UnauthorizedException('Ancien mot de passe incorrect');
        const hashed = await bcrypt.hash(newPassword, 12);
        await this.usersRepo.update(userId, {
            password: hashed,
            passwordChangedAt: new Date(),
        });
        return { message: 'Mot de passe modifié avec succès' };
    }
    async getLoginHistory(userId) {
        return this.logsRepo.find({
            where: { user: { id: userId } },
            order: { loggedAt: 'DESC' },
            take: 50,
        });
    }
    async recordLog(user, email, ip, userAgent, status) {
        const log = this.logsRepo.create({
            user,
            email,
            ipAddress: ip,
            userAgent,
            status,
        });
        await this.logsRepo.save(log);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(login_log_entity_1.LoginLog)),
    __param(2, (0, typeorm_1.InjectRepository)(password_reset_entity_1.PasswordReset)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        mailer_1.MailerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map