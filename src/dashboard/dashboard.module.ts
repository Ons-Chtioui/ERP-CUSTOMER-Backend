import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Order } from '../orders/entities/order.entity';
import { OrderLine } from '../orders/entities/order-line.entity';
import { Invoice } from '../commercial/invoices/entities/invoice.entity';
import { InvoiceLine } from '../commercial/invoices/entities/invoice-line.entity';
import { Quote } from '../commercial/quotes/entities/quote.entity';
import { StockAlert } from '../stock-alerts/entities/stock-alert.entity';
import { Warehouse } from '../warehouses/entities/warehouse.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order, OrderLine, Invoice, InvoiceLine, Quote,
      StockAlert, Warehouse, InventoryItem,
    ]),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}
