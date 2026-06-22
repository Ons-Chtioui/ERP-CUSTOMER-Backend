// src/commercial/invoices/entities/payment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { User } from '../../../users/entities/user.entity';

export enum PaymentMethod {
  CASH          = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE        = 'cheque',
  CARD          = 'card',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  @Column({ name: 'invoice_id', type: 'int' })
  declare invoiceId: number;

  /**
   * La facture à laquelle ce paiement est rattaché.
   * Un paiement est toujours lié à une seule facture.
   * Plusieurs paiements peuvent exister pour une même facture
   * (paiements partiels cumulables).
   */
  @ManyToOne(() => Invoice, (invoice) => invoice.payments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  declare invoice: Invoice;

  /**
   * Montant de ce paiement en TND.
   * La somme des payments.amount pour une facture = invoice.amountPaid.
   */
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare amount: number;

  @Column({
    type: 'varchar',
    length: 30,
    default: PaymentMethod.BANK_TRANSFER,
  })
  declare method: PaymentMethod;

  /**
   * Référence externe optionnelle :
   * numéro de chèque, numéro de virement, etc.
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  declare reference: string | null;

  /** Date effective du paiement (peut différer de la date de saisie) */
  @Column({ name: 'paid_at', type: 'date' })
  declare paidAt: string;

  @Column({ type: 'text', nullable: true })
  declare note: string | null;

  @Column({ name: 'created_by', type: 'int' })
  declare createdBy: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  declare creator: User;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}