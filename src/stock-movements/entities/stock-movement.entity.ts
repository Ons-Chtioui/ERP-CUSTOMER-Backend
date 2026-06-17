import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Component } from '../../components/entities/component.entity';
import { User } from '../../users/entities/user.entity';

export enum MovementType {
  IN         = 'IN',
  OUT        = 'OUT',
  TRANSFER   = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('increment')
    id!: number;

  @ManyToOne(() => Warehouse)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse!: Warehouse;

  @ManyToOne(() => Component)
    @JoinColumn({ name: 'component_id' })
    component!: Component;

  @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user!: User;

  @Column({ type: 'enum', enum: MovementType })
    type!: MovementType;

  @Column({ type: 'int' })
    quantity!: number;

  @Column({ name: 'quantity_before', type: 'int' })
    quantityBefore!: number;

  @Column({ name: 'quantity_after', type: 'int' })
    quantityAfter!: number;


  @Column({ name: 'reference_doc', length: 100, nullable: true })
    referenceDoc!: string;

  @Column({ type: 'text', nullable: true })
    notes!: string;

  @ManyToOne(() => Warehouse, { nullable: true })
    @JoinColumn({ name: 'target_warehouse_id' })
    targetWarehouse!: Warehouse | null;

  @Column({ name: 'inventory_session_id',type:'int', nullable: true })
    inventorySessionId!: number | null;

  // IMMUTABLE — pas de UpdateDateColumn
  @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}