// src/stock-movements/stock-movements.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockMovement } from './entities/stock-movement.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';
import { StockAlertsModule } from '../stock-alerts/stock-alerts.module';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, InventoryItem]), StockAlertsModule],
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
  exports: [StockMovementsService],
})
export class StockMovementsModule {}