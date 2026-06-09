import {
  Injectable, NotFoundException,
  ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Role } from '../roles/entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permsRepo: Repository<Permission>,
  ) {}

  async findAll() {
    return this.usersRepo.find({
      relations: { role: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: { role: { permissions: true }, permissions: true },
    });
    if (!user) throw new NotFoundException(`Utilisateur #${id} introuvable`);
    return user;
  }

  async create(dto: CreateUserDto, adminId: number) {
    // Vérifier email unique
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    // Charger le rôle
    const role = await this.rolesRepo.findOne({
      where: { id: dto.roleId },
      relations: { permissions: true },
    });
    if (!role) throw new NotFoundException('Rôle introuvable');

    // Hasher le mot de passe
    const password = await bcrypt.hash(dto.password || 'ChangeMe@1234', 12);

    // Charger les permissions individuelles si fournies
    // (déjà pré-sélectionnées = permissions du rôle, ajustées par l'admin)
    let permissions: Permission[] = [];
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      permissions = await this.permsRepo.findBy({ id: In(dto.permissionIds) });
    } else {
      // Par défaut : prendre les permissions du rôle
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

  async update(id: number, dto: Partial<CreateUserDto>) {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Cet email est déjà utilisé');
    }

    if (dto.roleId) {
      const role = await this.rolesRepo.findOne({ where: { id: dto.roleId } });
      if (!role) throw new NotFoundException('Rôle introuvable');
      user.role = role;
    }

    Object.assign(user, {
      nom: dto.nom ?? user.nom,
      prenom: dto.prenom ?? user.prenom,
      email: dto.email ?? user.email,
    });

    return this.usersRepo.save(user);
  }

  async softDelete(id: number) {
    const user = await this.findOne(id);
    await this.usersRepo.softDelete(id);
  }

  async getPermissions(userId: number) {
    const user = await this.findOne(userId);
    return {
      permissions: user.permissions.map((p) => ({ id: p.id, nom: p.nom, module: p.module, action: p.action })),
    };
  }

  async updatePermissions(userId: number, permissionIds: number[], adminId: number) {
    const user = await this.findOne(userId);
    const permissions = permissionIds.length > 0
      ? await this.permsRepo.findBy({ id: In(permissionIds) })
      : [];

    user.permissions = permissions;
    return this.usersRepo.save(user);
  }

  async toggleActive(id: number) {
    const user = await this.findOne(id);
    await this.usersRepo.update(id, { isActive: !user.isActive });
    return { id, isActive: !user.isActive };
  }
}