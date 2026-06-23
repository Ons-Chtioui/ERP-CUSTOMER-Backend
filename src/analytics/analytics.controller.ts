// src/analytics/analytics.controller.ts
import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

function getCurrentYear(): number {
  return new Date().getFullYear();
}

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly exports: ExportService,
  ) {}

  // ── Données JSON ─────────────────────────────────────────────

  @Get('kpis')
  @RequirePermission('analytics.read')
  getMainKpis(@Query('year') year?: string) {
    return this.analytics.getMainKpis(year ? Number(year) : undefined);
  }

  @Get('monthly-ca')
  @RequirePermission('analytics.read')
  getMonthlyCa(@Query('year') year?: string) {
    return this.analytics.getMonthlyCa(year ? Number(year) : undefined);
  }

  @Get('top-products')
  @RequirePermission('analytics.read')
  getTopProducts(
    @Query('limit') limit?: string,
    @Query('year') year?: string,
  ) {
    return this.analytics.getTopProducts(
      limit ? Number(limit) : 10,
      year ? Number(year) : undefined,
    );
  }

  @Get('stock-status')
  @RequirePermission('analytics.read')
  getStockStatus() {
    return this.analytics.getStockStatus();
  }

  @Get('orders-by-status')
  @RequirePermission('analytics.read')
  getOrdersByStatus() {
    return this.analytics.getOrdersByStatus();
  }

  @Get('warehouse-performance')
  @RequirePermission('analytics.read')
  getWarehousePerformance() {
    return this.analytics.getWarehousePerformance();
  }

  @Get('rolling-12-months')
  @RequirePermission('analytics.read')
  getRolling12Months() {
    return this.analytics.getRolling12Months();
  }

  // ── Exports Excel ─────────────────────────────────────────────

  @Get('export/monthly-ca')
  @RequirePermission('analytics.export')
  async exportMonthlyCa(
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const y = year ? Number(year) : getCurrentYear();
    const buffer = await this.exports.exportMonthlyCaExcel(y);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="ca-mensuel-${y}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/top-products')
  @RequirePermission('analytics.export')
  async exportTopProducts(
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const y = year ? Number(year) : getCurrentYear();
    const buffer = await this.exports.exportTopProductsExcel(y);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="top-produits-${y}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('export/dashboard')
  @RequirePermission('analytics.export')
  async exportFullDashboard(
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const y = year ? Number(year) : getCurrentYear();
    const buffer = await this.exports.exportFullDashboardExcel(y);
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="dashboard-${y}-${date}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }
}