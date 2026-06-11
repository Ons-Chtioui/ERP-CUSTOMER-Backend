import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Historique des productions.
 * IMPORTANT : cout_total est un SNAPSHOT — il ne doit JAMAIS être recalculé après coup.
 * Même si le prix des composants change, le coût de la production passée reste celui
 * qui était en vigueur au moment de la production.
 */
@Entity('production_logs')
export class ProductionLog {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Product, (p) => p.productionLogs)
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse!: Warehouse;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  /** Nombre d'unités produites */
  @Column({ type: 'decimal', precision: 12, scale: 4 })
  quantity!: number;

  /**
   * Snapshot du coût unitaire AU MOMENT de la production.
   * Stocké ici pour que l'historique reste fiable même si les prix changent ensuite.
   */
  @Column({ name: 'cout_unitaire_snapshot', type: 'decimal', precision: 12, scale: 4 })
  coutUnitaireSnapshot!: number;

  /** Coût total = quantity × coutUnitaireSnapshot */
  @Column({ name: 'cout_total', type: 'decimal', precision: 12, scale: 4 })
  coutTotal!: number;

  @Column({ type: 'text', nullable: true })
  notes!: string;

  @CreateDateColumn({ name: 'produced_at' })
  producedAt!: Date;
}
