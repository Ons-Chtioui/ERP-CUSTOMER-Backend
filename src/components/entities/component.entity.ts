import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';
import { Supplier } from './supplier.entity';
import { InventoryItem } from './inventory-item.entity';
import { StockMovement } from '../../stock-movements/entities/stock-movement.entity';
@Entity('components')
export class Component {
  @PrimaryGeneratedColumn('increment')
    id!: number
    @Column({ length: 150 })
    nom!: string;           
    @Column({ type:'text' ,nullable: true })        
    description!: string;
 @Column({ length: 80, unique: true })
  reference!: string;
   @Column({ length: 20, default: 'unité' })
  unite!: string;

  @Column({ name: 'prix_achat', type: 'decimal', precision: 12, scale: 4, default: 0 })
  prixAchat!: number;

  @Column({ name: 'seuil_alerte', default: 0 })
  seuilAlerte!: number;

  @Column({ length: 100, nullable: true })
  barcode!: string;

  @Column({ name: 'image_url', length: 255, nullable: true })
  imageUrl!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
    @ManyToOne(() => Category, (c) => c.components, { nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @ManyToOne(() => Supplier, (s) => s.components, { nullable: true, eager: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @OneToMany(() => InventoryItem, (i) => i.component)
  inventoryItems!: InventoryItem[];

  @OneToMany(() => StockMovement, (m) => m.component)
  movements!: StockMovement[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}