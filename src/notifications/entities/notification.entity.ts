// src/notifications/entities/notification.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  STOCK_ALERT  = 'stock_alert',
  ORDER_STATUS = 'order_status',
  INVOICE_DUE  = 'invoice_due',
  EMAIL_SENT   = 'email_sent',
  INFO         = 'info',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  @Column({ name: 'user_id', type: 'int' })
  declare userId: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  declare user: User;

  @Column({ type: 'varchar', length: 50 })
  declare type: NotificationType;

  @Column({ type: 'varchar', length: 200 })
  declare title: string;

  @Column({ type: 'text' })
  declare message: string;

  /** URL de redirection quand l'utilisateur clique */
  @Column({ type: 'varchar', length: 500, nullable: true })
  declare link: string | null;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  declare isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}