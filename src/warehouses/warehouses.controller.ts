// src/warehouses/warehouses.controller.ts
import {
  Controller, Get, Post, Put, Patch,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('warehouses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WarehousesController {
  constructor(private readonly svc: WarehousesService) {}

  @Get()                  
  @RequirePermissions('stock.view')
  findAll()                
  { return this.svc.findAll(); }

  @Get('summary')          
  @RequirePermissions('stock.view')
  summary() 
  { return this.svc.getGlobalSummary(); }

  @Get(':id')           
  @RequirePermissions('stock.view')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Get(':id/stock')        @RequirePermissions('stock.view')
  getStock(@Param('id', ParseIntPipe) id: number) { return this.svc.getStock(id); }

  @Post()                  @RequirePermissions('stock.create')
  create(@Body() dto: CreateWarehouseDto) { return this.svc.create(dto); }

  @Put(':id')              @RequirePermissions('stock.edit')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateWarehouseDto>) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/toggle')     @RequirePermissions('stock.edit')
  toggle(@Param('id', ParseIntPipe) id: number) { return this.svc.toggleActive(id); }
}