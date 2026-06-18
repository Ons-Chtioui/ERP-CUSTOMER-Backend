// src/orders/entities/order-line-supplement.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { OrderLine } from './order-line.entity';
import { Component } from '../../components/entities/component.entity';

@Entity('order_line_supplements')
export class OrderLineSupplement {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  @Column({ name: 'order_line_id', type: 'int' })
  declare orderLineId: number;

  @ManyToOne(() => OrderLine, (line) => line.supplements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_line_id' })
  declare orderLine: OrderLine;

  @Column({ name: 'component_id', type: 'int' })
  declare componentId: number;

  @ManyToOne(() => Component, { eager: true })
  @JoinColumn({ name: 'component_id' })
  declare component: Component;

  @Column({ type: 'numeric', precision: 10, scale: 3 })
  declare quantity: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 3 })
  declare unitPrice: number;

  @Column({ name: 'tva_rate', type: 'numeric', precision: 5, scale: 2, default: 19 })
  declare tvaRate: number;

  @Column({ name: 'total_ht', type: 'numeric', precision: 12, scale: 3 })
  declare totalHt: number;


  @Column({ name: 'qty_deducted', type: 'numeric', precision: 10, scale: 3, default: 0 })
  declare qtyDeducted: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  declare note: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}