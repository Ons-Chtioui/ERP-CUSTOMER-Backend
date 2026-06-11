import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_categories')
export class ProductCategory {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ length: 100, unique: true })
  nom!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @OneToMany(() => Product, (p) => p.category)
  products!: Product[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
