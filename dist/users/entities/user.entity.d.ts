import { Role } from "../../roles/entities/role.entity";
import { Permission } from "../../permissions/entities/permission.entity";
export declare class User {
    id: number;
    companyId: number;
    nom: string;
    prenom: string;
    email: string;
    password: string;
    isActive: boolean;
    failedAttempts: number;
    lockedUntil: Date | null;
    emailVerifiedAt: Date | null;
    lastLoginAt: Date | null;
    passwordChangedAt: Date | null;
    role: Role;
    permissions: Permission[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
}
