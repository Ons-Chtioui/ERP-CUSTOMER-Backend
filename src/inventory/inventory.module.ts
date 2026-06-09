// src/inventory/inventory.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventorySession } from './entities/inventory-session.entity';
import { InventoryLine } from './entities/inventory-line.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { Component } from '../components/entities/component.entity';
import { StockMovement } from '../stock-movements/entities/stock-movement.entity';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    InventorySession, InventoryLine, InventoryItem, Component, StockMovement,
  ])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}