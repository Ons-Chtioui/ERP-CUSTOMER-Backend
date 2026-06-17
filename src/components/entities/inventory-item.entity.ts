import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, UpdateDateColumn, Unique,
} from 'typeorm';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Component } from './component.entity';

@Entity('inventory_items')
@Unique(['warehouse', 'component'])
export class InventoryItem {
  @PrimaryGeneratedColumn('increment')
    id!: number;

  @ManyToOne(() => Warehouse, (w) => w.inventoryItems)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse!: Warehouse;

  @ManyToOne(() => Component, (c) => c.inventoryItems)
    @JoinColumn({ name: 'component_id' })
    component!: Component;

  @Column({ type: 'int', default: 0 })
    quantity!: number;

  @Column({ name: 'reserved_qty', type: 'int', default: 0 })
    reservedQty!: number;


  @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}