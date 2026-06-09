import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./entities/user.entity").User[]>;
    findOne(id: number): Promise<import("./entities/user.entity").User>;
    create(dto: CreateUserDto, admin: {
        id: number;
    }): Promise<import("./entities/user.entity").User>;
    update(id: number, dto: Partial<CreateUserDto>): Promise<import("./entities/user.entity").User>;
    remove(id: number): Promise<void>;
    getPermissions(id: number): Promise<{
        permissions: {
            id: number;
            nom: string;
            module: string;
            action: string;
        }[];
    }>;
    updatePermissions(id: number, permissionIds: number[], admin: {
        id: number;
    }): Promise<import("./entities/user.entity").User>;
    toggle(id: number): Promise<{
        id: number;
        isActive: boolean;
    }>;
}
