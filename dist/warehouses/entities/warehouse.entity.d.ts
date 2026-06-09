import { InventoryItem } from '../../components/entities/inventory-item.entity';
import { StockMovement } from '../../stock-movements/entities/stock-movement.entity';
import { InventorySession } from '../../inventory/entities/inventory-session.entity';
import { StockAlert } from '../../stock-alerts/entities/stock-alert.entity';
export declare class Warehouse {
    id: number;
    companyId: number;
    nom: string;
    adresse: string;
    code: string;
    ville: string;
    pays: string;
    isActive: boolean;
    inventoryItems: InventoryItem[];
    stockMovements: StockMovement[];
    inventorySessions: InventorySession[];
    stockAlerts: StockAlert[];
    createdAt: Date;
    updatedAt: Date;
}
