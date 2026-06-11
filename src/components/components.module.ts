import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComponentsService } from './components.service';
import { ComponentsController } from './components.controller';
import { Component } from './entities/component.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { Category } from './entities/category.entity';
import { Supplier } from './entities/supplier.entity';
// forwardRef évite la dépendance circulaire Components ↔ Products
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Component, Category, Supplier, InventoryItem]),
    forwardRef(() => ProductsModule),
  ],
  providers: [ComponentsService],
  controllers: [ComponentsController],
  exports: [ComponentsService, TypeOrmModule],
})
export class ComponentsModule {}
