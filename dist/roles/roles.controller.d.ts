import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
export declare class RolesController {
    private readonly rolesRepo;
    private readonly permsRepo;
    constructor(rolesRepo: Repository<Role>, permsRepo: Repository<Permission>);
    findAll(): Promise<Role[]>;
    findOne(id: number): Promise<Role | null>;
    updateRolePermissions(id: number, permissionIds: number[]): Promise<Role>;
}
