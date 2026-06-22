// src/commercial/invoices/entities/invoice.entity.ts
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
import { Order } from '../../../orders/entities/order.entity';
import { Quote } from '../../quotes/entities/quote.entity';
import { InvoiceLine } from './invoice-line.entity';
import { Payment } from './payment.entity';


export enum InvoiceStatus {
  DRAFT     = 'draft',
  SENT      = 'sent',
  PARTIAL   = 'partial',
  PAID      = 'paid',
  OVERDUE   = 'overdue',
  CANCELLED = 'cancelled',
}

export enum InvoiceType {
  INVOICE     = 'invoice',
  CREDIT_NOTE = 'credit_note',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  /**
   * Référence auto-générée :
   *   type = INVOICE     → FAC-2024-0001
   *   type = CREDIT_NOTE → AV-2024-0001
   */
  @Column({ type: 'varchar', length: 50, unique: true })
  declare reference: string;

  @Column({ name: 'client_id', type: 'int' })
  declare clientId: number;

  @ManyToOne(() => Client, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  declare client: Client;

  /**
   * Lien optionnel vers le devis source.
   * Renseigné si la facture est issue d'une conversion de devis.
   */
  @Column({ name: 'quote_id', type: 'int', nullable: true })
  declare quoteId: number | null;

  @ManyToOne(() => Quote, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'quote_id' })
  declare quote: Quote | null;

  /**
   * Lien optionnel vers la commande source.
   * Renseigné si la facture est générée depuis une commande Module 5.
   */
  @Column({ name: 'order_id', type: 'int', nullable: true })
  declare orderId: number | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  declare order: Order | null;

  /**
   * Facture source pour un avoir (credit_note).
   */
  @Column({ name: 'original_invoice_id', type: 'int', nullable: true })
  declare originalInvoiceId: number | null;

  @ManyToOne(() => Invoice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'original_invoice_id' })
  declare originalInvoice: Invoice | null;

  /**
   * Discriminant : 'invoice' ou 'credit_note'
   * Un avoir (credit_note) est une facture négative liée à une facture originale.
   */
  @Column({
    type: 'varchar',
    length: 20,
    default: InvoiceType.INVOICE,
  })
  declare type: InvoiceType;

  @Column({
    type: 'varchar',
    length: 20,
    default: InvoiceStatus.DRAFT,
  })
  declare status: InvoiceStatus;

  /** Date limite de paiement (pour le calcul OVERDUE par le cron) */
  @Column({ name: 'due_date', type: 'date', nullable: true })
  declare dueDate: string | null;

  @Column({ type: 'text', nullable: true })
  declare note: string | null;

  /** Remise globale en % appliquée sur le total HT */
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

  /**
   * Montant cumulé des paiements reçus.
   * Mis à jour automatiquement à chaque paiement.
   * Quand amountPaid >= totalTtc → statut passe à PAID.
   */
  @Column({
    name: 'amount_paid',
    type: 'numeric',
    precision: 12,
    scale: 3,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare amountPaid: number;

  @Column({ name: 'created_by', type: 'int' })
  declare createdBy: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  declare creator: User;

  @OneToMany(() => InvoiceLine, (line) => line.invoice, {
    cascade: ['insert', 'update', 'remove'],
    eager: false,
  })
  declare lines: InvoiceLine[];

  @OneToMany(() => Payment, (payment) => payment.invoice, {
    cascade: false,
    eager: false,
  })
  declare payments: Payment[];

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}