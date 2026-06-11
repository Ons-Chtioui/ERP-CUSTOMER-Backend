import {
  Controller, Get, Post, Put, Delete,
  Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ProductCategoriesService } from './product-categories.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@Controller('product-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductCategoriesController {
  constructor(private readonly svc: ProductCategoriesService) {}

  @Get()
  @RequirePermissions('bom.view')
  findAll() { return this.svc.findAll(); }

  @Get(':id')
  @RequirePermissions('bom.view')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.svc.findOne(id); }

  @Post()
  @RequirePermissions('bom.create')
  create(@Body() dto: CreateProductCategoryDto) { return this.svc.create(dto); }

  @Put(':id')
  @RequirePermissions('bom.edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<CreateProductCategoryDto>,
  ) { return this.svc.update(id, dto); }

  @Delete(':id')
  @RequirePermissions('bom.delete')
  remove(@Param('id', ParseIntPipe) id: number) { return this.svc.remove(id); }
}
