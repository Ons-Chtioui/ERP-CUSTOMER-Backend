import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { InventoryItem } from '../../components/entities/inventory-item.entity';
import { StockMovement } from '../../stock-movements/entities/stock-movement.entity';
import { InventorySession } from '../../inventory/entities/inventory-session.entity';
import { StockAlert } from '../../stock-alerts/entities/stock-alert.entity';

@Entity('warehouses')
export class Warehouse {
  @PrimaryGeneratedColumn('increment')
    id!: number;
    @Column({ name: 'company_id', nullable: true })
    companyId!: number;
    @Column({ length: 100 })
    nom!: string;
    @Column({ length: 255, nullable: true })
    adresse!: string;
    @Column({ length: 20, nullable: true })
    code!: string;
     @Column({ length: 100, nullable: true })
  ville!: string;

  @Column({ length: 60, default: 'France' })
  pays!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
    @OneToMany(() => InventoryItem, (item) => item.warehouse)   
    inventoryItems!: InventoryItem[];
    @OneToMany(() => StockMovement, (movement) => movement.warehouse)
    stockMovements!: StockMovement[];
    @OneToMany(() => InventorySession, (session) => session.warehouse)
    inventorySessions!: InventorySession[];
    @OneToMany(() => StockAlert, (alert) => alert.warehouse)
    stockAlerts!: StockAlert[];
    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;
}   