import {
  Controller, Get, Put, Param, Body,
  ParseIntPipe, UseGuards, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from './entities/role.entity';
import { Permission } from '../permissions/entities/permission.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permsRepo: Repository<Permission>,
  ) {}

  @Get()
  findAll() {
    return this.rolesRepo.find({
      relations: { permissions: true },
      order: { label: 'ASC' },
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesRepo.findOne({
      where: { id },
      relations: { permissions: true },
    });
  }

  /** Super admin peut modifier les permissions d'un rôle */
  @Put(':id/permissions')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('users.roles')
  async updateRolePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissionIds') permissionIds: number[],
  ) {
    const role = await this.rolesRepo.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) throw new NotFoundException(`Rôle #${id} introuvable`);

    role.permissions = permissionIds.length > 0
      ? await this.permsRepo.findBy({ id: In(permissionIds) })
      : [];

    return this.rolesRepo.save(role);
  }
}
