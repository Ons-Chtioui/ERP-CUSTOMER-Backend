import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { Product } from './product.entity';
import { Component } from '../../components/entities/component.entity';

/**
 * Ligne de nomenclature (BOM = Bill of Materials)
 * Un composant ne peut apparaître qu'une fois par produit (contrainte UNIQUE)
 */
@Entity('bom_lines')
@Unique(['product', 'component']) // unicité composant par produit
export class BomLine {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Product, (p) => p.bomLines, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Component, { eager: true })
  @JoinColumn({ name: 'component_id' })
  component!: Component;

  /** Quantité nécessaire pour fabriquer 1 unité du produit */
  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantity!: number;
}
