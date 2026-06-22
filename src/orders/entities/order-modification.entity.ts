import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';

@Entity('order_modifications')
export class OrderModification {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  @Column({ name: 'order_id', type: 'int' })
  declare orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  declare order: Order;

  @Column({ type: 'varchar', length: 50 })
  declare action: string;

  @Column({ type: 'text', nullable: true })
  declare details: string | null;

  @Column({ name: 'changed_by', type: 'int' })
  declare changedBy: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'changed_by' })
  declare user: User;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}
