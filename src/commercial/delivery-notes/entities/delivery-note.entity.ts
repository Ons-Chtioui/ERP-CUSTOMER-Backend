// src/commercial/delivery-notes/entities/delivery-note.entity.ts
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
import { Invoice } from '../../invoices/entities/invoice.entity';
import { DeliveryNoteLine } from './delivery-note-line.entity';

export enum DeliveryStatus {
  PENDING   = 'pending',
  DELIVERED = 'delivered',
  SIGNED    = 'signed',
}

@Entity('delivery_notes')
export class DeliveryNote {
  @PrimaryGeneratedColumn('increment')
  declare id: number;

  /** Référence auto-générée : BL-2024-0001 */
  @Column({ type: 'varchar', length: 50, unique: true })
  declare reference: string;

  @Column({ name: 'client_id', type: 'int' })
  declare clientId: number;

  @ManyToOne(() => Client, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'client_id' })
  declare client: Client;

  /**
   * Lien optionnel vers la commande source (Module 5).
   * Cas d'usage :
   *   orderId seul    → BL généré depuis une commande
   *   invoiceId seul  → BL lié à une facture
   *   les deux        → flux complet commande → facture → BL
   *   aucun           → BL manuel indépendant
   */
  @Column({ name: 'order_id', type: 'int', nullable: true })
  declare orderId: number | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  declare order: Order | null;

  /** Lien optionnel vers la facture associée */
  @Column({ name: 'invoice_id', type: 'int', nullable: true })
  declare invoiceId: number | null;

  @ManyToOne(() => Invoice, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invoice_id' })
  declare invoice: Invoice | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: DeliveryStatus.PENDING,
  })
  declare status: DeliveryStatus;

  /** Adresse de livraison (peut différer de l'adresse client) */
  @Column({ name: 'delivery_address', type: 'text', nullable: true })
  declare deliveryAddress: string | null;

  /** Date et heure effective de livraison */
  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  declare deliveredAt: Date | null;

  /**
   * URL de l'image de signature client.
   * Renseigné quand le client signe physiquement → statut = SIGNED.
   */
  @Column({ name: 'signature_url', type: 'varchar', length: 500, nullable: true })
  declare signatureUrl: string | null;

  @Column({ type: 'text', nullable: true })
  declare note: string | null;

  @Column({ name: 'created_by', type: 'int' })
  declare createdBy: number;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  declare creator: User;

  @OneToMany(() => DeliveryNoteLine, (line) => line.deliveryNote, {
    cascade: ['insert', 'update', 'remove'],
    eager: false,
  })
  declare lines: DeliveryNoteLine[];

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  declare updatedAt: Date;
}