// src/commercial/delivery-notes/entities/delivery-note-line.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DeliveryNote } from './delivery-note.entity';
import { Product } from '../../../products/entities/product.entity';

@Entity('delivery_note_lines')
export class DeliveryNoteLine {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  @Column({ name: 'delivery_note_id', type: 'int' })
  declare deliveryNoteId: number;

  @ManyToOne(() => DeliveryNote, (dn) => dn.lines, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'delivery_note_id' })
  declare deliveryNote: DeliveryNote;

  @Column({ name: 'product_id', type: 'int' })
  declare productId: number;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  declare product: Product;

  /**
   * Quantité initialement prévue à livrer.
   * Peut différer de quantityDelivered en cas de livraison partielle.
   */
  @Column({
    name: 'quantity_ordered',
    type: 'numeric',
    precision: 10,
    scale: 3,
    default: 0,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare quantityOrdered: number;

  /**
   * Quantité réellement livrée au client.
   * Renseignée lors du markDelivered().
   * Peut être < quantityOrdered (livraison partielle).
   */
  @Column({
    name: 'quantity_delivered',
    type: 'numeric',
    precision: 10,
    scale: 3,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => parseFloat(v ?? '0'),
    },
  })
  declare quantityDelivered: number;

  /** Ordre d'affichage dans le document */
  @Column({ type: 'int', default: 0 })
  declare position: number;
}