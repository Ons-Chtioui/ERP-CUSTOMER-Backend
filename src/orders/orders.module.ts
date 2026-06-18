import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order }               from './entities/order.entity';
import { OrderLine }           from './entities/order-line.entity';
import { OrderStatusHistory }  from './entities/order-status-history.entity';

import { Product }             from '../products/entities/product.entity';
import { BomLine }             from '../products/entities/bom-line.entity';
import { ProductInventory }    from '../products/entities/product-inventory.entity';
import { InventoryItem }       from '../components/entities/inventory-item.entity';
import { Warehouse }           from '../warehouses/entities/warehouse.entity';
import { ProductsModule }      from '../products/products.module';

import { OrdersService }    from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderLineSupplement } from './entities/order-line-supplement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, OrderLine, OrderStatusHistory,OrderLineSupplement,
      Product, BomLine, ProductInventory, InventoryItem, Warehouse,
    ]),
    ProductsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule {}
