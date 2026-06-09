import { Category } from './category.entity';
import { Supplier } from './supplier.entity';
import { InventoryItem } from './inventory-item.entity';
import { StockMovement } from '../../stock-movements/entities/stock-movement.entity';
export declare class Component {
    id: number;
    nom: string;
    description: string;
    reference: string;
    unite: string;
    prixAchat: number;
    seuilAlerte: number;
    barcode: string;
    imageUrl: string;
    isActive: boolean;
    category: Category;
    supplier: Supplier;
    inventoryItems: InventoryItem[];
    movements: StockMovement[];
    createdAt: Date;
    updatedAt: Date;
}
