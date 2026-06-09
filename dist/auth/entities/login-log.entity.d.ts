import { User } from '../../users/entities/user.entity';
export declare enum LoginStatus {
    SUCCESS = "success",
    FAILED = "failed",
    BLOCKED = "blocked"
}
export declare class LoginLog {
    id: number;
    user: User | null;
    email: string;
    ipAddress: string;
    userAgent: string;
    status: LoginStatus;
    loggedAt: Date;
}
