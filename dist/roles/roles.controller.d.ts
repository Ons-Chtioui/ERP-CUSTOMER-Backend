import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
export declare class RolesController {
    private readonly rolesRepo;
    constructor(rolesRepo: Repository<Role>);
    findAll(): Promise<Role[]>;
    findOne(id: number): Promise<Role | null>;
}
