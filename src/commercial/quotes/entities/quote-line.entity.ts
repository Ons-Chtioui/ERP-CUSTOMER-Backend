// src/commercial/quotes/entities/quote-line.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Quote } from './quote.entity';
import { Product } from '../../../products/entities/product.entity';

@Entity('quote_lines')
export class QuoteLine {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  @Column({ name: 'quote_id', type: 'int' })
  declare quoteId: number;

  @ManyToOne(() => Quote, (quote) => quote.lines, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'quote_id' })
  declare quote: Quote;

  @Column({ name: 'product_id', type: 'int' })
  declare productId: number;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  declare product: Product;

  /**
   * Description personnalisée de la ligne.
   * Si null, on utilise le nom du produit à l'affichage.
   */
  @Column({ type: 'text', nullable: true })
  declare description: string | null;

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