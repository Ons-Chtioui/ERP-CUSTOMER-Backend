import {
  Controller, Get, Post, Param, ParseIntPipe,
  Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  private streamPdf(res: Response, buffer: Buffer, filename: string) {
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Get('quotes/:id/pdf')
  @RequirePermission('quotes.view')
  async quotePdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, filename } = await this.service.generateQuotePdf(id);
    this.streamPdf(res, buffer, filename);
  }

  @Post('quotes/:id/send')
  @RequirePermission('quotes.edit')
  sendQuote(@Param('id', ParseIntPipe) id: number) {
    return this.service.sendQuoteEmail(id);
  }

  @Get('invoices/:id/pdf')
  @RequirePermission('invoices.view')
  async invoicePdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, filename } = await this.service.generateInvoicePdf(id);
    this.streamPdf(res, buffer, filename);
  }

  @Post('invoices/:id/send')
  @RequirePermission('invoices.edit')
  sendInvoice(@Param('id', ParseIntPipe) id: number) {
    return this.service.sendInvoiceEmail(id);
  }

  @Get('delivery-notes/:id/pdf')
  @RequirePermission('delivery.view')
  async deliveryPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, filename } = await this.service.generateDeliveryNotePdf(id);
    this.streamPdf(res, buffer, filename);
  }

  @Get('orders/:id/pdf')
  @RequirePermission('orders.view')
  async orderPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, filename } = await this.service.generateOrderPdf(id);
    this.streamPdf(res, buffer, filename);
  }

  @Get('inventory/:id/pdf')
  @RequirePermission('stock.inventory')
  async inventoryPdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const { buffer, filename } = await this.service.generateInventoryPdf(id);
    this.streamPdf(res, buffer, filename);
  }
}
