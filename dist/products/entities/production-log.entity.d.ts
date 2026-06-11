import { Product } from './product.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
export declare class ProductionLog {
    id: number;
    product: Product;
    warehouse: Warehouse;
    user: User;
    quantity: number;
    coutUnitaireSnapshot: number;
    coutTotal: number;
    notes: string;
    producedAt: Date;
}
