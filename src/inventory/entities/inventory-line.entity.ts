import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { InventorySession } from './inventory-session.entity';
import { Component } from '../../components/entities/component.entity';

@Entity('inventory_lines')
export class InventoryLine {
  @PrimaryGeneratedColumn('increment')
    id!: number;

  @ManyToOne(() => InventorySession, (s) => s.lines)
    @JoinColumn({ name: 'session_id' })
    session!: InventorySession;

  @ManyToOne(() => Component)
    @JoinColumn({ name: 'component_id' })
    component!: Component;

  @Column({ name: 'quantity_theoretical', type: 'decimal', precision: 12, scale: 4 })
    quantityTheoretical!: number;

  @Column({ name: 'quantity_counted', type: 'decimal', precision: 12, scale: 4, nullable: true })
    quantityCounted!: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 4, nullable: true })
    ecart!: number | null;

  @Column({ type: 'text', nullable: true })
    notes!: string;

  @Column({ name: 'counted_at', type: 'timestamp', nullable: true })
    countedAt!: Date | null;
}