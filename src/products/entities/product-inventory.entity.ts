import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, UpdateDateColumn, Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

/**
 * Stock du produit fini par entrepôt.
 * Similaire à inventory_items pour les composants, mais pour les produits finis.
 * La contrainte UNIQUE garantit qu'il ne peut y avoir qu'une seule ligne par (produit, entrepôt).
 */
@Entity('product_inventory')
@Unique(['product', 'warehouse'])
export class ProductInventory {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Product, (p) => p.inventory)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @Column({ type: 'int', default: 0 })
  quantity!: number;


  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
