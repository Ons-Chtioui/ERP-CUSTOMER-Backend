import { InventorySession } from './inventory-session.entity';
import { Component } from '../../components/entities/component.entity';
export declare class InventoryLine {
    id: number;
    session: InventorySession;
    component: Component;
    quantityTheoretical: number;
    quantityCounted: number | null;
    ecart: number | null;
    notes: string;
    countedAt: Date | null;
}
