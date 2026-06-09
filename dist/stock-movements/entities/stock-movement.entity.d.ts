import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Component } from '../../components/entities/component.entity';
import { User } from '../../users/entities/user.entity';
export declare enum MovementType {
    IN = "IN",
    OUT = "OUT",
    TRANSFER = "TRANSFER",
    ADJUSTMENT = "ADJUSTMENT"
}
export declare class StockMovement {
    id: number;
    warehouse: Warehouse;
    component: Component;
    user: User;
    type: MovementType;
    quantity: number;
    quantityBefore: number;
    quantityAfter: number;
    referenceDoc: string;
    notes: string;
    targetWarehouse: Warehouse | null;
    inventorySessionId: number | null;
    createdAt: Date;
}
