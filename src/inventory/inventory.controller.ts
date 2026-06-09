// src/inventory/inventory.controller.ts
import {
  Controller, Get, Post, Param,
  Body, ParseIntPipe, UseGuards, Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly svc: InventoryService) {}

  @Get()              @RequirePermissions('stock.view')
  findAll(@Query('warehouseId') wId?: string) {
    return this.svc.findAll(wId ? +wId : undefined);
  }

  @Get(':id')         @RequirePermissions('stock.view')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Post()             @RequirePermissions('stock.edit')
  create(@Body() dto: { warehouseId: number; nom?: string }, @CurrentUser() u: { id: number }) {
    return this.svc.createSession(dto, u.id);
  }

  @Post(':id/start')  @RequirePermissions('stock.edit')
  start(@Param('id', ParseIntPipe) id: number) { return this.svc.startSession(id); }

  @Post(':id/count')  @RequirePermissions('stock.edit')
  count(
    @Param('id', ParseIntPipe) id: number,
    @Body() b: { componentId: number; quantityCounted: number; notes?: string },
  ) { return this.svc.countLine(id, b.componentId, b.quantityCounted, b.notes); }

  @Post(':id/close')  @RequirePermissions('stock.edit')
  close(@Param('id', ParseIntPipe) id: number, @CurrentUser() u: { id: number }) {
    return this.svc.closeSession(id, u.id);
  }
}