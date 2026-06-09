// src/inventory/entities/inventory-session.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
import { InventoryLine } from './inventory-line.entity';

export enum SessionStatus {
  DRAFT       = 'draft',
  IN_PROGRESS = 'in_progress',
  CLOSED      = 'closed',
}

@Entity('inventory_sessions')
export class InventorySession {
  @PrimaryGeneratedColumn('increment')
    id!: number;

  @ManyToOne(() => Warehouse)
    @JoinColumn({ name: 'warehouse_id' })
    warehouse!: Warehouse;

  @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'user_id' })
    user!: User;

  @Column({ length: 150, nullable: true })
    nom!: string;

  @Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.DRAFT })
    status!: SessionStatus;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
    startedAt!: Date | null;

  @Column({ name: 'closed_at', type: 'timestamp', nullable: true })
    closedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
    notes!: string;

  @OneToMany(() => InventoryLine, (l) => l.session, { cascade: true })
    lines!: InventoryLine[];

  @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}