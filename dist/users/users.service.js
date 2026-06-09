"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const role_entity_1 = require("../roles/entities/role.entity");
const permission_entity_1 = require("../permissions/entities/permission.entity");
const user_entity_1 = require("./entities/user.entity");
let UsersService = class UsersService {
    usersRepo;
    rolesRepo;
    permsRepo;
    constructor(usersRepo, rolesRepo, permsRepo) {
        this.usersRepo = usersRepo;
        this.rolesRepo = rolesRepo;
        this.permsRepo = permsRepo;
    }
    async findAll() {
        return this.usersRepo.find({
            relations: { role: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const user = await this.usersRepo.findOne({
            where: { id },
            relations: { role: { permissions: true }, permissions: true },
        });
        if (!user)
            throw new common_1.NotFoundException(`Utilisateur #${id} introuvable`);
        return user;
    }
    async create(dto, adminId) {
        const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('Cet email est déjà utilisé');
        const role = await this.rolesRepo.findOne({
            where: { id: dto.roleId },
            relations: { permissions: true },
        });
        if (!role)
            throw new common_1.NotFoundException('Rôle introuvable');
        const password = await bcrypt.hash(dto.password || 'ChangeMe@1234', 12);
        let permissions = [];
        if (dto.permissionIds && dto.permissionIds.length > 0) {
            permissions = await this.permsRepo.findBy({ id: (0, typeorm_2.In)(dto.permissionIds) });
        }
        else {
            permissions = role.permissions;
        }
        const user = this.usersRepo.create({
            nom: dto.nom,
            prenom: dto.prenom,
            email: dto.email,
            password,
            role,
            permissions,
            isActive: true,
        });
        return this.usersRepo.save(user);
    }
    async update(id, dto) {
        const user = await this.findOne(id);
        if (dto.email && dto.email !== user.email) {
            const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
            if (existing)
                throw new common_1.ConflictException('Cet email est déjà utilisé');
        }
        if (dto.roleId) {
            const role = await this.rolesRepo.findOne({ where: { id: dto.roleId } });
            if (!role)
                throw new common_1.NotFoundException('Rôle introuvable');
            user.role = role;
        }
        Object.assign(user, {
            nom: dto.nom ?? user.nom,
            prenom: dto.prenom ?? user.prenom,
            email: dto.email ?? user.email,
        });
        return this.usersRepo.save(user);
    }
    async softDelete(id) {
        const user = await this.findOne(id);
        await this.usersRepo.softDelete(id);
    }
    async getPermissions(userId) {
        const user = await this.findOne(userId);
        return {
            permissions: user.permissions.map((p) => ({ id: p.id, nom: p.nom, module: p.module, action: p.action })),
        };
    }
    async updatePermissions(userId, permissionIds, adminId) {
        const user = await this.findOne(userId);
        const permissions = permissionIds.length > 0
            ? await this.permsRepo.findBy({ id: (0, typeorm_2.In)(permissionIds) })
            : [];
        user.permissions = permissions;
        return this.usersRepo.save(user);
    }
    async toggleActive(id) {
        const user = await this.findOne(id);
        await this.usersRepo.update(id, { isActive: !user.isActive });
        return { id, isActive: !user.isActive };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(2, (0, typeorm_1.InjectRepository)(permission_entity_1.Permission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], UsersService);
//# sourceMappingURL=users.service.js.map