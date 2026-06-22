// ============================================================
// src/commercial/invoices/invoices.controller.ts
// ============================================================
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  // POST /invoices — création manuelle
  @Post()
  @RequirePermission('invoices.create')
  create(@Body() dto: CreateInvoiceDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  // GET /invoices
  @Get()
  @RequirePermission('invoices.view')
  findAll(@Query() query: QueryInvoicesDto) {
    return this.service.findAll(query);
  }

  // GET /invoices/stats
  @Get('stats')
  @RequirePermission('invoices.view')
  getStats() {
    return this.service.getStats();
  }

  // GET /invoices/:id
  @Get(':id')
  @RequirePermission('invoices.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // PATCH /invoices/:id/send — DRAFT → SENT + email PDF
  @Patch(':id/send')
  @RequirePermission('invoices.edit')
  markSent(@Param('id', ParseIntPipe) id: number) {
    return this.service.markSent(id);
  }

  // POST /invoices/:id/payments — ajouter un paiement (partiel ou total)
  @Post(':id/payments')
  @RequirePermission('invoices.pay')
  addPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPaymentDto,
    @Request() req: any,
  ) {
    return this.service.addPayment(id, dto, req.user.id);
  }

  // POST /invoices/:id/credit-note — générer un avoir
  @Post(':id/credit-note')
  @RequirePermission('credits.create')
  createCreditNote(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCreditNoteDto,
    @Request() req: any,
  ) {
    return this.service.createCreditNote(id, req.user.id, dto.reason);
  }

  // PATCH /invoices/:id/cancel
  @Patch(':id/cancel')
  @RequirePermission('invoices.cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id);
  }
} 