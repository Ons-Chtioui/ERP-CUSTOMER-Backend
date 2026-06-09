import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { Component } from '../../components/entities/component.entity';
export declare enum AlertStatus {
    ACTIVE = "active",
    RESOLVED = "resolved"
}
export declare class StockAlert {
    id: number;
    warehouse: Warehouse;
    component: Component;
    quantityAtAlert: number;
    threshold: number;
    status: AlertStatus;
    resolvedAt: Date | null;
    createdAt: Date;
}
