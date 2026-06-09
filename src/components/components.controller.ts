// src/components/components.controller.ts
import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ComponentsService } from './components.service';
import { CreateComponentDto } from './dto/create-component.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('components')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComponentsController {
  constructor(private readonly svc: ComponentsService) {}

  @Get()
  @RequirePermissions('stock.view')
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
  ) {
    return this.svc.findAll({
      search,
      categoryId: categoryId ? +categoryId : undefined,
      supplierId: supplierId ? +supplierId : undefined,
    });
  }

  @Get('categories')  @RequirePermissions('stock.view')
  categories() { return this.svc.findAllCategories(); }

  @Get('suppliers')   @RequirePermissions('stock.view')
  suppliers()  { return this.svc.findAllSuppliers(); }

  @Get(':id')         @RequirePermissions('stock.view')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Get(':id/stock')   @RequirePermissions('stock.view')
  stock(@Param('id', ParseIntPipe) id: number) { return this.svc.getStockSummary(id); }

  @Post()             @RequirePermissions('stock.create')
  create(@Body() dto: CreateComponentDto) { return this.svc.create(dto); }

  @Put(':id')         @RequirePermissions('stock.edit')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateComponentDto>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')      @RequirePermissions('stock.delete')
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.deactivate(id); }

  @Post('categories') @RequirePermissions('stock.create')
  createCategory(@Body() b: { nom: string; description?: string }) {
    return this.svc.createCategory(b.nom, b.description);
  }

  @Post('suppliers')  @RequirePermissions('stock.create')
  createSupplier(@Body() b: any) { return this.svc.createSupplier(b); }
}