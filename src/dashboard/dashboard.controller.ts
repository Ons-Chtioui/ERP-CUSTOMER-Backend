import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('analytics')
  @RequirePermission('reports.view')
  getAnalytics() {
    return this.service.getAnalytics();
  }

  @Get('export')
  @RequirePermission('reports.export')
  async export(
    @Query('type') type: 'dashboard' | 'orders' | 'invoices' = 'dashboard',
    @Query('format') format: 'csv' | 'json' = 'csv',
    @Res() res: Response,
  ) {
    if (format === 'json') {
      return res.json(await this.service.getAnalytics());
    }
    const csv = await this.service.exportCsv(type);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${type}-export.csv"`,
    });
    res.send('\uFEFF' + csv);
  }
}
