import { Permission } from "../../permissions/entities/permission.entity";
import { User } from "../../users/entities/user.entity";
export declare class Role {
    id: number;
    nom: string;
    label: string;
    description: string;
    users: User[];
    permissions: Permission[];
    createdAt: Date;
}
