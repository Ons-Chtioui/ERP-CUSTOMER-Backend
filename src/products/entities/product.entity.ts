import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { ProductCategory } from '../../product-categories/entities/product-category.entity';
import { BomLine } from './bom-line.entity';
import { ProductionLog } from './production-log.entity';
import { ProductInventory } from './product-inventory.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({ length: 150 })
  nom!: string;

  /** Code unique — ex: CHAISE-001, CHAISE-001-R pour variante */
  @Column({ length: 80, unique: true })
  reference!: string;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ length: 20, default: 'unité' })
  unite!: string;

  /**
   * Prix de vente saisi manuellement — surcharge le calculé si > 0
   * Si 0 ou null → on utilise prixVenteAuto
   */
  @Column({ name: 'prix_vente', type: 'decimal', precision: 12, scale: 4, default: 0 })
  prixVente!: number;

  /**
   * Prix de vente calculé automatiquement :
   *   prixVenteAuto = Σ(qte_composant × prixVente_composant) + coutMO
   * Recalculé à chaque changement de BOM, prix vente composant, ou coutMO.
   */
  @Column({ name: 'prix_vente_auto', type: 'decimal', precision: 12, scale: 4, default: 0 })
  prixVenteAuto!: number;

  /**
   * Coût de revient = Σ(qte × prixAchat) + coutMO
   * Recalculé automatiquement — NE PAS modifier manuellement
   */
  @Column({ name: 'cout_revient', type: 'decimal', precision: 12, scale: 4, default: 0 })
  coutRevient!: number;

  /** Coût main d'œuvre (saisi manuellement) */
  @Column({ name: 'cout_mo', type: 'decimal', precision: 12, scale: 4, default: 0 })
  coutMO!: number;

  /** Seuil d'alerte stock produit fini */
  @Column({ name: 'seuil_alerte', default: 0 })
  seuilAlerte!: number;

  @Column({ name: 'image_url', type: 'varchar', length: 255, nullable: true })
  imageUrl!: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  /** Produit parent si c'est une variante (max 2 niveaux) */
  @ManyToOne(() => Product, (p) => p.variants, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: Product | null;

  @OneToMany(() => Product, (p) => p.parent)
  variants!: Product[];

  @ManyToOne(() => ProductCategory, (c) => c.products, { nullable: true, eager: true })
  @JoinColumn({ name: 'category_id' })
  category!: ProductCategory | null;

  /** Lignes BOM — composants nécessaires à la fabrication */
  @OneToMany(() => BomLine, (b) => b.product, { cascade: true })
  bomLines!: BomLine[];

  /** Historique des productions (snapshot du coût) */
  @OneToMany(() => ProductionLog, (l) => l.product)
  productionLogs!: ProductionLog[];

  /** Stock par entrepôt */
  @OneToMany(() => ProductInventory, (i) => i.product)
  inventory!: ProductInventory[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
