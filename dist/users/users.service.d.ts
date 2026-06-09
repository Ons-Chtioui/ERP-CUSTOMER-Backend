import { Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly usersRepo;
    private readonly rolesRepo;
    private readonly permsRepo;
    constructor(usersRepo: Repository<User>, rolesRepo: Repository<Role>, permsRepo: Repository<Permission>);
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User>;
    create(dto: CreateUserDto, adminId: number): Promise<User>;
    update(id: number, dto: Partial<CreateUserDto>): Promise<User>;
    softDelete(id: number): Promise<void>;
    getPermissions(userId: number): Promise<{
        permissions: {
            id: number;
            nom: string;
            module: string;
            action: string;
        }[];
    }>;
    updatePermissions(userId: number, permissionIds: number[], adminId: number): Promise<User>;
    toggleActive(id: number): Promise<{
        id: number;
        isActive: boolean;
    }>;
}
