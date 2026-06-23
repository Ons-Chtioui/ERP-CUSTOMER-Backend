// src/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ExportService } from './export.service';
import { Invoice } from '../commercial/invoices/entities/invoice.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderLine } from '../orders/entities/order-line.entity';
import { Component } from '../components/entities/component.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity'; // ✅ AJOUTÉ

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      Order,
      OrderLine,
      Component,
      Product,
      InventoryItem,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, ExportService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}