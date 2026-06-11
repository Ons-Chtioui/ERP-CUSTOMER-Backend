import { Product } from './product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
export declare class ProductInventory {
    id: number;
    product: Product;
    warehouse: Warehouse;
    quantity: number;
    updatedAt: Date;
}
