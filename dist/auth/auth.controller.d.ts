import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(dto: LoginDto, req: Request, res: Response): Promise<{
        accessToken: string;
        user: {
            id: number;
            nom: string;
            prenom: string;
            email: string;
            role: string;
            permissions: string[];
        };
    }>;
    logout(res: Response): {
        message: string;
    };
    refresh(user: {
        id: number;
    }, res: Response): Promise<{
        accessToken: string;
    }>;
    getProfile(user: {
        id: number;
    }): Promise<{
        id: number;
        nom: string;
        prenom: string;
        email: string;
        role: string;
        permissions: string[];
        lastLoginAt: Date | null;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto & {
        resetId: number;
    }): Promise<{
        message: string;
    }>;
    changePassword(user: {
        id: number;
    }, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
    getLogs(user: {
        id: number;
    }): Promise<import("./entities/login-log.entity").LoginLog[]>;
}
