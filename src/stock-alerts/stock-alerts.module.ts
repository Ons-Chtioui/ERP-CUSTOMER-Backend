
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockAlert } from './entities/stock-alert.entity';
import { Component } from '../components/entities/component.entity';
import { StockAlertsService } from './stock-alerts.service';
import { StockAlertsController } from './stock-alerts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockAlert, Component])],
  controllers: [StockAlertsController],
  providers: [StockAlertsService],
  exports: [StockAlertsService],
})
export class StockAlertsModule {}