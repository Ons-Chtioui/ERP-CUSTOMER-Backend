import { Module } from '@nestjs/common';
import { ComponentsService } from './components.service';
import { ComponentsController } from './components.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Component } from './entities/component.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { Category } from './entities/category.entity';
import { Supplier } from './entities/supplier.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Component,Category,Supplier,InventoryItem])],
  providers: [ComponentsService],
  controllers: [ComponentsController],
  exports:[ComponentsService,TypeOrmModule]
})
export class ComponentsModule {}
