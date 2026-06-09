import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
export declare class PermissionsController {
    private readonly permsRepo;
    constructor(permsRepo: Repository<Permission>);
    findAll(): Promise<Permission[]>;
}
