import {
  Controller, Get, Post, Put, Delete, Patch,
  Body, Param, Query, ParseIntPipe,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { OrdersService }        from './orders.service';
import { CreateOrderDto }       from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrdersDto }       from './dto/query-orders.dto';
import { JwtAuthGuard }         from '../common/guards/jwt-auth.guard';
import { PermissionsGuard }     from '../common/guards/permissions.guard';
import { RequirePermission }    from '../common/decorators/require-permission.decorator';
import { CurrentUser }          from '../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  @Post()
  @RequirePermission('orders.create')
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: { id: number }) {
    return this.service.create(dto, user.id);
  }

  @Get()
  @RequirePermission('orders.view')
  findAll(@Query() query: QueryOrdersDto) {
    return this.service.findAll(query);
  }

  @Get('stats')
  @RequirePermission('orders.view')
  getStats() {
    return this.service.getStats();
  }

  @Get('fulfillment-preview')
  @RequirePermission('orders.view')
  previewLineFulfillment(
    @Query('productId', ParseIntPipe) productId: number,
    @Query('quantity',  ParseIntPipe) quantity: number,
  ) {
    return this.service.previewLineFulfillment(productId, quantity);
  }

  /**
   * GET /orders/stock-by-warehouse/:productId
   * Retourne le stock fini + fabricable de ce produit pour chaque entrepôt.
   * Utilisé par le frontend pour afficher la disponibilité lors de la création.
   */
  @Get('stock-by-warehouse/:productId')
  @RequirePermission('orders.view')
  getStockByWarehouse(@Param('productId', ParseIntPipe) productId: number) {
    return this.service.getStockByWarehouse(productId);
  }

  @Get(':id')
  @RequirePermission('orders.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermission('orders.edit')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.updateStatus(id, dto, user.id);
  }

  @Put(':id/lines')
  @RequirePermission('orders.edit')
  updateLines(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateOrderDto>,
    @CurrentUser() user: { id: number },
  ) {
    return this.service.updateLines(id, dto, user.id);
  }

  @Get(':id/availability')
  @RequirePermission('orders.view')
  checkAvailability(@Param('id', ParseIntPipe) id: number) {
    return this.service.checkAvailability(id);
  }

  @Delete(':id')
  @RequirePermission('orders.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}