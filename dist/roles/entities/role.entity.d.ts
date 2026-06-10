import type { User } from '../../users/entities/user.entity';
import { Permission } from '../../permissions/entities/permission.entity';
export declare class Role {
    id: number;
    nom: string;
    label: string;
    description: string;
    users: User[];
    permissions: Permission[];
    createdAt: Date;
}
