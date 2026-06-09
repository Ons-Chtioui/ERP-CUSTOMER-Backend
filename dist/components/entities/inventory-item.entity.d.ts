import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Component } from './component.entity';
export declare class InventoryItem {
    id: number;
    warehouse: Warehouse;
    component: Component;
    quantity: number;
    reservedQty: number;
    updatedAt: Date;
}
