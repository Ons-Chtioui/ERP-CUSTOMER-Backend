// src/stock-alerts/stock-alerts.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StockAlertsService } from './stock-alerts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('stock-alerts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StockAlertsController {
  constructor(private readonly svc: StockAlertsService) {}

  @Get()
  @RequirePermissions('stock.view')
  findActive(@Query('warehouseId') wId?: string) {
    return this.svc.findActive(wId ? +wId : undefined);
  }
}