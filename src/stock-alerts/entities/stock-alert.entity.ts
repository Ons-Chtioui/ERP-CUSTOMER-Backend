import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Component } from '../../components/entities/component.entity';

export enum AlertStatus {
  ACTIVE   = 'active',
  RESOLVED = 'resolved',
}

@Entity('stock_alerts')
export class StockAlert {
  @PrimaryGeneratedColumn('increment')
    id!: number;

  @ManyToOne(() => Warehouse)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse!: Warehouse;

  @ManyToOne(() => Component)
    @JoinColumn({ name: 'component_id' })
    component!: Component;

  @Column({ name: 'quantity_at_alert', type: 'decimal', precision: 12, scale: 4 })
    quantityAtAlert!: number;

  @Column()
    threshold!: number;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
    status!: AlertStatus;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
    resolvedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}