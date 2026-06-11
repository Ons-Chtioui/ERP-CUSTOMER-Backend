import { Module, forwardRef, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModuleRef } from '@nestjs/core';

import { Product }          from './entities/product.entity';
import { BomLine }          from './entities/bom-line.entity';
import { ProductionLog }    from './entities/production-log.entity';
import { ProductInventory } from './entities/product-inventory.entity';

import { Component }        from '../components/entities/component.entity';
import { InventoryItem }    from '../components/entities/inventory-item.entity';
import { Warehouse }        from '../warehouses/entities/warehouse.entity';
import { StockMovement }    from '../stock-movements/entities/stock-movement.entity';
import { ProductCategory }  from '../product-categories/entities/product-category.entity';

import { ProductsService }    from './products.service';
import { ProductsController } from './products.controller';
import { ComponentsModule }   from '../components/components.module';
import { ComponentsService }  from '../components/components.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product, BomLine, ProductionLog, ProductInventory,
      Component, InventoryItem, Warehouse, StockMovement, ProductCategory,
    ]),
    forwardRef(() => ComponentsModule),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule implements OnModuleInit {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Après l'initialisation du module, injecter ProductsService dans ComponentsService
   * pour éviter la dépendance circulaire au niveau du constructeur.
   */
  onModuleInit() {
    try {
      const compSvc = this.moduleRef.get(ComponentsService, { strict: false });
      compSvc.setProductsService(this.productsService);
    } catch {
      // ComponentsService non disponible dans ce contexte — pas bloquant
    }
  }
}
