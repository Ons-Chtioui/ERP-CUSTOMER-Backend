// src/orders/orders.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderLinesDto } from './dto/update-order-lines.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  // ─── CRÉER UNE COMMANDE ──────────────────────────────────────────────────

  @Post()
  @RequirePermission('orders.create')
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: { id: number }) {
    return this.service.create(dto, user.id);
  }

  // ─── LISTER LES COMMANDES ─────────────────────────────────────────────────

  @Get()
  @RequirePermission('orders.view')  // ← Changé : orders.read → orders.view
  findAll(@Query() query: QueryOrdersDto) {
    return this.service.findAll(query);
  }

  // ─── STATISTIQUES ─────────────────────────────────────────────────────────

  @Get('stats')
  @RequirePermission('orders.view')
  getStats() {
    return this.service.getStats();
  }

  @Get('fulfillment-preview')
  @RequirePermission('orders.view')
  previewLineFulfillment(
    @Query('productId', ParseIntPipe) productId: number,
    @Query('quantity', ParseIntPipe) quantity: number,
  ) {
    return this.service.previewLineFulfillment(productId, quantity);
  }

  // ─── DÉTAIL D'UNE COMMANDE ───────────────────────────────────────────────

  @Get(':id')
  @RequirePermission('orders.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // ─── CHANGER LE STATUT ────────────────────────────────────────────────────

  @Patch(':id/status')
  @RequirePermission('orders.edit')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.updateStatus(id, dto, user.id);
  }

  // ─── MODIFIER LES LIGNES (DRAFT seulement) ──────────────────────────────

  @Put(':id/lines')
  @RequirePermission('orders.edit')  // ← Changé : orders.update → orders.edit
  updateLines(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderLinesDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.updateLines(id, dto, user.id);
  }

  // ─── VÉRIFIER LA DISPONIBILITÉ ──────────────────────────────────────────

  @Get(':id/availability')
  @RequirePermission('orders.view')
  checkAvailability(@Param('id', ParseIntPipe) id: number) {
    return this.service.checkAvailability(id);
  }

  // ─── SUPPRIMER UNE COMMANDE (DRAFT seulement) ───────────────────────────

  @Delete(':id')
  @RequirePermission('orders.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}