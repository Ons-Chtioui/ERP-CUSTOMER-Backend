import { Controller, Get, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class PermissionsController {
  constructor(
    @InjectRepository(Permission)
    private readonly permsRepo: Repository<Permission>,
  ) {}

  @Get()
  findAll() {
    return this.permsRepo.find({ order: { module: 'ASC', action: 'ASC' } });
  }
}
