// src/commercial/invoices/entities/invoice-line.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { Product } from '../../../products/entities/product.entity';

@Entity('invoice_lines')
export class InvoiceLine {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  @Column({ name: 'invoice_id', type: 'int' })
  declare invoiceId: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.lines, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoice_id' })
  declare invoice: Invoice;

  /**
   * Produit optionnel.
   * Null possible si la ligne est une description libre
   * (frais de service, prestation, etc.)
   */
  @Column({ name: 'product_id', type: 'int', nullable: true })
  declare productId: number | null;

  @ManyToOne(() => Product, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  declare product: Product | null;

  /**
   * Description obligatoire affichée sur la facture.
   * Si productId renseigné, initialisé avec le nom du produit.
   * Modifiable librement pour personnaliser l'affichage.
   */
  @Column({ type: 'varchar', length: 300 })
  declare description: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 3,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare quantity: number;

  @Column({
    name: 'unit_price',
    type: 'numeric',
    precision: 12,
    scale: 3,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare unitPrice: number;

  /** Taux TVA en % (défaut 19%) */
  @Column({
    name: 'tva_rate',
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 19,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '19'),
    },
  })
  declare tvaRate: number;

  /** Remise ligne en % */
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

  /**
   * Total HT ligne = quantity × unitPrice × (1 - discount / 100)
   * Calculé et stocké par le service.
   */
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

  /** Ordre d'affichage dans le document */
  @Column({ type: 'int', default: 0 })
  declare position: number;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}