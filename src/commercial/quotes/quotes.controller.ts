// ============================================================
// src/commercial/quotes/quotes.controller.ts
// ============================================================
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('quotes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  // POST /quotes
  @Post()
  @RequirePermission('quotes.create')
  create(@Body() dto: CreateQuoteDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  // GET /quotes
  @Get()
  @RequirePermission('quotes.view')
  findAll(@Query() query: QueryQuotesDto) {
    return this.service.findAll(query);
  }

  // GET /quotes/:id
  @Get(':id')
  @RequirePermission('quotes.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // PATCH /quotes/:id/status
  @Patch(':id/status')
  @RequirePermission('quotes.edit')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQuoteStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  // POST /quotes/:id/convert
  // Convertit le devis en facture — copie toutes les lignes
  @Post(':id/convert')
  @RequirePermission('quotes.convert')
  convertToInvoice(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.service.convertToInvoice(id, req.user.id);
  }

  // DELETE /quotes/:id
  @Delete(':id')
  @RequirePermission('quotes.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}