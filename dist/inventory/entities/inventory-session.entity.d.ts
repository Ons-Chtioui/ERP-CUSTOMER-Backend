import { Warehouse } from '../../warehouses/entities/warehouse.entity';
import { User } from '../../users/entities/user.entity';
import { InventoryLine } from './inventory-line.entity';
export declare enum SessionStatus {
    DRAFT = "draft",
    IN_PROGRESS = "in_progress",
    CLOSED = "closed"
}
export declare class InventorySession {
    id: number;
    warehouse: Warehouse;
    user: User;
    nom: string;
    status: SessionStatus;
    startedAt: Date | null;
    closedAt: Date | null;
    notes: string;
    lines: InventoryLine[];
    createdAt: Date;
}
