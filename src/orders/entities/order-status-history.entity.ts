import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('increment')          // ← number auto-increment
  declare id: number;

  @Column({ name: 'order_id', type: 'int' })
  declare orderId: number;

  @ManyToOne(() => Order, (o) => o.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  declare order: Order;

  @Column({ name: 'from_status', type: 'varchar', nullable: true })
  declare fromStatus: string | null;

  @Column({ name: 'to_status', type: 'varchar' })
  declare toStatus: string;

  @Column({ name: 'changed_by', type: 'int' })
  declare changedBy: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'changed_by' })
  declare user: User;

  @Column({ type: 'varchar', nullable: true })
  declare comment: string | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}