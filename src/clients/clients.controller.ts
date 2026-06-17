import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseUUIDPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Post()
  @RequirePermissions('clients.create')
  create(@Body() dto: CreateClientDto) { return this.service.create(dto); }

  @Get()
  @RequirePermissions('clients.view')
  findAll(@Query('search') search?: string) { return this.service.findAll(search); }

  @Get(':id')
  @RequirePermissions('clients.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) { return this.service.findOne(id); }

  @Put(':id')
  @RequirePermissions('clients.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/toggle')
  @RequirePermissions('clients.edit')
  toggle(@Param('id', ParseUUIDPipe) id: string) { return this.service.toggle(id); }

  @Delete(':id')
  @RequirePermissions('clients.edit')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}
