import { User } from '../../users/entities/user.entity';
export declare class PasswordReset {
    id: number;
    user: User;
    token: string;
    expiresAt: Date;
    usedAt: Date | null;
    attempts: number;
    createdAt: Date;
}
