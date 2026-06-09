// src/stock-movements/stock-movements.controller.ts
import {
  Controller, Get, Post, Body, Query, UseGuards,
} from '@nestjs/common';
import { StockMovementsService } from './stock-movements.service';
import { CreateMovementDto, CreateTransferDto } from './dto/create-movement.dto';
import { MovementType } from './entities/stock-movement.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('stock-movements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockMovementsController {
  constructor(private readonly svc: StockMovementsService) {}

  @Get()
  @RequirePermissions('stock.view')
  findHistory(
    @Query('warehouseId') wId?: string,
    @Query('componentId') cId?: string,
    @Query('type') type?: MovementType,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findHistory({
      warehouseId: wId ? +wId : undefined,
      componentId: cId ? +cId : undefined,
      type,
      limit: limit ? +limit : 100,
    });
  }

  @Post('in')
  @RequirePermissions('stock.create')
  createIn(@Body() dto: CreateMovementDto, @CurrentUser() u: { id: number }) {
    return this.svc.createIn(dto, u.id);
  }

  @Post('out')
  @RequirePermissions('stock.create')
  createOut(@Body() dto: CreateMovementDto, @CurrentUser() u: { id: number }) {
    return this.svc.createOut(dto, u.id);
  }

  @Post('transfer')
  @RequirePermissions('stock.transfer')
  createTransfer(@Body() dto: CreateTransferDto, @CurrentUser() u: { id: number }) {
    return this.svc.createTransfer(dto, u.id);
  }
}