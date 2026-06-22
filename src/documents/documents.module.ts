import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Quote } from '../commercial/quotes/entities/quote.entity';
import { Invoice } from '../commercial/invoices/entities/invoice.entity';
import { DeliveryNote } from '../commercial/delivery-notes/entities/delivery-note.entity';
import { Order } from '../orders/entities/order.entity';
import { InventorySession } from '../inventory/entities/inventory-session.entity';
import { ProductInventory } from '../products/entities/product-inventory.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quote, Invoice, DeliveryNote, Order, InventorySession, ProductInventory,
    ]),
  ],
  providers: [DocumentsService],
  controllers: [DocumentsController],
  exports: [DocumentsService],
})
export class DocumentsModule {}
