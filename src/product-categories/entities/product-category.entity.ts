import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ length: 100 })
  nom!: string;

  /** Code couleur HEX pour l'affichage UI — ex: "#3B82F6" */
  @Column({ length: 7, default: '#6366F1' })
  couleur!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @OneToMany(() => Product, (p) => p.category)
  products!: Product[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
