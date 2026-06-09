import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepo: Repository<Role>,
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
}
