import {
  Column, CreateDateColumn, Entity,
  JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_lines')
export class OrderLine {
  @PrimaryGeneratedColumn('increment')          // ← number auto-increment
  declare id: number;

  @Column({ name: 'order_id', type: 'int' })
  declare orderId: number;

  @ManyToOne(() => Order, (order) => order.lines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  declare order: Order;

  @Column({ name: 'product_id', type: 'int' })
  declare productId: number;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'product_id' })
  declare product: Product;

  @Column({ type: 'int' })
  declare quantity: number;

  /** Quantité prélevée sur le stock produit fini (rempli à la confirmation) */
  @Column({ name: 'qty_from_stock', type: 'int', default: 0 })
  declare qtyFromStock: number;

  /** Quantité à assembler depuis les composants (rempli à la confirmation) */
  @Column({ name: 'qty_from_assembly', type: 'int', default: 0 })
  declare qtyFromAssembly: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 3 })
  declare unitPrice: number;

  @Column({ name: 'tva_rate', type: 'numeric', precision: 5, scale: 2, default: 19 })
  declare tvaRate: number;

  @Column({ type: 'numeric', precision: 5, scale: 2, default: 0 })
  declare discount: number;

  @Column({ name: 'total_ht', type: 'numeric', precision: 12, scale: 3 })
  declare totalHt: number;

  @CreateDateColumn({ name: 'created_at' })
  declare createdAt: Date;
}