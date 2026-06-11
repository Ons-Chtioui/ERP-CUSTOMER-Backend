import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SetBomDto } from './dto/set-bom.dto';
import { ProduceDto } from './dto/produce.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  // ── CRUD produits ─────────────────────────────────────────────

  @Get()
  @RequirePermissions('bom.view')
  findAll(
    @Query('search')     search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('parentId')   parentId?: string,
  ) {
    return this.svc.findAll({
      search,
      categoryId: categoryId ? +categoryId : undefined,
      parentId:   parentId   ? +parentId   : undefined,
    });
  }

  @Get(':id')
  @RequirePermissions('bom.view')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Post()
  @RequirePermissions('bom.create')
  create(@Body() dto: CreateProductDto) { return this.svc.create(dto); }

  @Put(':id')
  @RequirePermissions('bom.edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateProductDto>,
  ) { return this.svc.update(id, dto); }

  @Delete(':id')
  @RequirePermissions('bom.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  archive(@Param('id', ParseIntPipe) id: number) { return this.svc.archive(id); }

  // ── BOM ───────────────────────────────────────────────────────

  @Get(':id/bom')
  @RequirePermissions('bom.view')
  getBom(@Param('id', ParseIntPipe) id: number) { return this.svc.getBom(id); }

  /** Remplace entièrement la BOM */
  @Put(':id/bom')
  @RequirePermissions('bom.edit')
  setBom(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetBomDto,
  ) { return this.svc.setBom(id, dto); }

  /** Ajoute ou met à jour une seule ligne BOM */
  @Patch(':id/bom/:componentId')
  @RequirePermissions('bom.edit')
  upsertBomLine(
    @Param('id', ParseIntPipe) id: number,
    @Param('componentId', ParseIntPipe) componentId: number,
    @Body('quantity') quantity: number,
  ) { return this.svc.upsertBomLine(id, componentId, quantity); }

  /** Supprime une seule ligne BOM */
  @Delete(':id/bom/:componentId')
  @RequirePermissions('bom.edit')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBomLine(
    @Param('id', ParseIntPipe) id: number,
    @Param('componentId', ParseIntPipe) componentId: number,
  ) { return this.svc.deleteBomLine(id, componentId); }

  // ── Disponibilité ─────────────────────────────────────────────

  /** Calcule le stock disponible (unités fabricables) */
  @Get(':id/availability')
  @RequirePermissions('bom.view')
  getAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('warehouseId') warehouseId?: string,
  ) { return this.svc.getAvailability(id, warehouseId ? +warehouseId : undefined); }

  /** Simule une production sans toucher au stock */
  @Post(':id/simulate')
  @RequirePermissions('bom.view')
  simulate(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { quantity: number; warehouseId: number },
  ) { return this.svc.simulate(id, body.quantity, body.warehouseId); }

  // ── Production ────────────────────────────────────────────────

  /** Lance la production (transaction atomique) */
  @Post(':id/produce')
  @RequirePermissions('bom.produce')
  produce(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProduceDto,
    @CurrentUser() user: { id: number },
  ) { return this.svc.produce(id, dto, user.id); }

  /** Historique des productions */
  @Get(':id/production-logs')
  @RequirePermissions('bom.view')
  getLogs(@Param('id', ParseIntPipe) id: number) { return this.svc.getProductionLogs(id); }

  // ── Stock produit fini ────────────────────────────────────────

  /** Stock du produit fini par entrepôt */
  @Get(':id/inventory')
  @RequirePermissions('bom.view')
  getInventory(@Param('id', ParseIntPipe) id: number) { return this.svc.getProductInventory(id); }

  /** Transfert de stock produit fini entre entrepôts */
  @Post(':id/inventory/transfer')
  @RequirePermissions('bom.edit')
  transferStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { fromWarehouseId: number; toWarehouseId: number; quantity: number },
    @CurrentUser() user: { id: number },
  ) {
    return this.svc.transferProductStock(
      id,
      body.fromWarehouseId,
      body.toWarehouseId,
      body.quantity,
      user.id,
    );
  }
}
