import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { Repository } from 'typeorm';
import { User } from "../users/entities/user.entity";
import { LoginLog } from './entities/login-log.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly usersRepo;
    private readonly logsRepo;
    private readonly resetRepo;
    private readonly jwtService;
    private readonly config;
    private readonly mailer;
    constructor(usersRepo: Repository<User>, logsRepo: Repository<LoginLog>, resetRepo: Repository<PasswordReset>, jwtService: JwtService, config: ConfigService, mailer: MailerService);
    login(dto: LoginDto, ip: string, userAgent: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: number;
            nom: string;
            prenom: string;
            email: string;
            role: string;
            permissions: string[];
        };
    }>;
    private handleFailedAttempt;
    buildTokens(user: User): {
        accessToken: string;
        refreshToken: string;
        user: {
            id: number;
            nom: string;
            prenom: string;
            email: string;
            role: string;
            permissions: string[];
        };
    };
    refresh(userId: number): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: number;
            nom: string;
            prenom: string;
            email: string;
            role: string;
            permissions: string[];
        };
    }>;
    getProfile(userId: number): Promise<{
        id: number;
        nom: string;
        prenom: string;
        email: string;
        role: string;
        permissions: string[];
        lastLoginAt: Date | null;
    }>;
    sendResetLink(email: string): Promise<void>;
    resetPassword(resetId: number, rawToken: string, newPassword: string): Promise<{
        message: string;
    }>;
    changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
    getLoginHistory(userId: number): Promise<LoginLog[]>;
    private recordLog;
}
