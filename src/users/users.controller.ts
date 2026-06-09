import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// Toutes les routes du controller sont protégées
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.view')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermissions('users.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('users.create')
  create(
    @Body() dto: CreateUserDto,
    @CurrentUser() admin: { id: number },
  ) {
    return this.usersService.create(dto, admin.id);
  }

  @Put(':id')
  @RequirePermissions('users.edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateUserDto>,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('users.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.softDelete(id);
  }

  // Récupérer les permissions individuelles d'un user
  @Get(':id/permissions')
  @RequirePermissions('users.view')
  getPermissions(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getPermissions(id);
  }

  // Modifier les permissions individuelles d'un user
  @Patch(':id/permissions')
  @RequirePermissions('users.edit')
  updatePermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body('permissionIds') permissionIds: number[],
    @CurrentUser() admin: { id: number },
  ) {
    return this.usersService.updatePermissions(id, permissionIds, admin.id);
  }

  // Activer / désactiver un compte
  @Patch(':id/toggle')
  @RequirePermissions('users.edit')
  toggle(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.toggleActive(id);
  }
}