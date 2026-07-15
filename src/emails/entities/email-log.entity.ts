// src/emails/entities/email-log.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EmailStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT    = 'sent',
  FAILED  = 'failed',
  BOUNCED = 'bounced',
}

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  @Column({ name: 'to_email', type: 'varchar', length: 200 })
  declare toEmail: string;

  @Column({ name: 'to_name', type: 'varchar', length: 150, nullable: true })
  declare toName: string | null;

  @Column({ type: 'varchar', length: 300 })
  declare subject: string;

  @Column({ type: 'varchar', length: 100 })
  declare template: string;

  @Column({ type: 'varchar', length: 20, default: EmailStatus.PENDING })
  declare status: EmailStatus;

  /** HTML envoyé — conservé pour permettre le resend() */
  @Column({ type: 'text', nullable: true })
  declare html: string | null;

  @Column({ type: 'text', nullable: true })
  declare error: string | null;

  /** Module source : 'quote' | 'invoice' | 'delivery_note' | 'alert' */
  @Column({ name: 'related_type', type: 'varchar', length: 50, nullable: true })
  declare relatedType: string | null;

  /** ID de l'entité source */
  @Column({ name: 'related_id', type: 'int', nullable: true })
  declare relatedId: number | null;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  declare sentAt: Date | null;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  declare createdBy: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  declare creator: User | null;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}