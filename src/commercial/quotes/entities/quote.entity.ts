// src/commercial/quotes/entities/quote.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { Client } from '../../../clients/entities/client.entity';

import { Invoice } from '../../invoices/entities/invoice.entity';
import { QuoteLine } from './quote-line.entity';


export enum QuoteStatus {
  DRAFT     = 'draft',
  SENT      = 'sent',
  ACCEPTED  = 'accepted',
  REFUSED   = 'refused',
  EXPIRED   = 'expired',
  CONVERTED = 'converted',
}

@Entity('quotes')
export class Quote {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  /** Référence auto-générée : DEV-2024-0001 */
  @Column({ type: 'varchar', length: 50, unique: true })
  declare reference: string;

  @Column({ name: 'client_id', type: 'int' })
  declare clientId: number;

  @ManyToOne(() => Client, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  declare client: Client;

  @Column({
    type: 'varchar',
    length: 20,
    default: QuoteStatus.DRAFT,
  })
  declare status: QuoteStatus;

  /** Date limite de validité du devis */
  @Column({ name: 'valid_until', type: 'date' })
  declare validUntil: string;

  @Column({ type: 'text', nullable: true })
  declare note: string | null;

  /** Remise globale en % appliquée sur le total HT des lignes */
  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare discount: number;

  @Column({
    name: 'total_ht',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare totalHt: number;

  @Column({
    name: 'total_tva',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare totalTva: number;

  @Column({
    name: 'total_ttc',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare totalTtc: number;

  /** ID de la facture générée après conversion */
  @Column({ name: 'converted_to', type: 'int', nullable: true })
  declare convertedTo: number | null;

  @ManyToOne(() => Invoice, { nullable: true })
  @JoinColumn({ name: 'converted_to' })
  declare convertedInvoice: Invoice | null;

  /** Date de conversion en facture */
  @Column({ name: 'converted_at', type: 'timestamp', nullable: true })
  declare convertedAt: Date | null;

  @Column({ name: 'created_by', type: 'int' })
  declare createdBy: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  declare creator: User;

  @OneToMany(() => QuoteLine, (line) => line.quote, {
    cascade: ['insert', 'update', 'remove'],
    eager: false,
  })
  declare lines: QuoteLine[];

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}