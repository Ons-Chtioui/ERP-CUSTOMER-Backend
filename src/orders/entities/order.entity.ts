import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Client }             from '../../clients/entities/client.entity';
import { User }               from '../../users/entities/user.entity';
import { Warehouse }          from '../../warehouses/entities/warehouse.entity';
import { OrderLine }          from './order-line.entity';
import { OrderStatusHistory } from './order-status-history.entity';

export enum OrderStatus {
  DRAFT     = 'draft',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SHIPPED   = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  @Column({ unique: true })
  declare reference: string;

  @Column({ name: 'client_id' })
  declare clientId: number;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'client_id' })
  declare client: Client;

  // ── Entrepôt de la commande ──────────────────────────────────
  // Détermine le stock affiché ET l'entrepôt de déduction à la confirmation.
  // Obligatoire : une commande doit toujours être liée à un entrepôt.
  @Column({ name: 'warehouse_id', type: 'int' })
  declare warehouseId: number;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  declare warehouse: Warehouse;

  @Column({ type: 'varchar', default: OrderStatus.DRAFT })
  declare status: OrderStatus;

  @Column({ type: 'text', nullable: true })
  declare note: string | null;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  declare discount: number;

  @Column({ name: 'total_ht', type: 'numeric', precision: 12, scale: 3, default: 0 })
  declare totalHt: number;

  @Column({ name: 'total_tva', type: 'numeric', precision: 12, scale: 3, default: 0 })
  declare totalTva: number;

  @Column({ name: 'total_ttc', type: 'numeric', precision: 12, scale: 3, default: 0 })
  declare totalTtc: number;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  declare confirmedAt: Date | null;

  @Column({ name: 'shipped_at', type: 'timestamp', nullable: true })
  declare shippedAt: Date | null;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  declare deliveredAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  declare cancelledAt: Date | null;

  @Column({ name: 'cancelled_by', type: 'int', nullable: true })
  declare cancelledBy: number | null;

  @Column({ name: 'created_by', type: 'int' })
  declare createdBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  declare creator: User;

  @OneToMany(() => OrderLine, (line) => line.order, { cascade: true })
  declare lines: OrderLine[];

  @OneToMany(() => OrderStatusHistory, (h) => h.order)
  declare statusHistory: OrderStatusHistory[];

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}