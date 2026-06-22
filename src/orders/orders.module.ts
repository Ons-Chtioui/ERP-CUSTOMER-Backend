import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Order }               from './entities/order.entity';
import { OrderLine }           from './entities/order-line.entity';
import { OrderStatusHistory }  from './entities/order-status-history.entity';
import { OrderModification }   from './entities/order-modification.entity';

import { Product }             from '../products/entities/product.entity';
import { BomLine }             from '../products/entities/bom-line.entity';
import { ProductInventory }    from '../products/entities/product-inventory.entity';
import { InventoryItem }       from '../components/entities/inventory-item.entity';
import { Warehouse }           from '../warehouses/entities/warehouse.entity';
import { ProductsModule }      from '../products/products.module';
import { DeliveryNotesModule } from '../commercial/delivery-notes/delivery-notes.module';

import { OrdersService }    from './orders.service';
import { OrdersController } from './orders.controller';
import { OrderLineSupplement } from './entities/order-line-supplement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, OrderLine, OrderStatusHistory, OrderModification, OrderLineSupplement,
      Product, BomLine, ProductInventory, InventoryItem, Warehouse,
    ]),
    ProductsModule,
    forwardRef(() => DeliveryNotesModule),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule {}
