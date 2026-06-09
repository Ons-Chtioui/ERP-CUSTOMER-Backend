import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly svc;
    constructor(svc: InventoryService);
    findAll(wId?: string): Promise<import("./entities/inventory-session.entity").InventorySession[]>;
    findOne(id: number): Promise<import("./entities/inventory-session.entity").InventorySession>;
    create(dto: {
        warehouseId: number;
        nom?: string;
    }, u: {
        id: number;
    }): Promise<import("./entities/inventory-session.entity").InventorySession>;
    start(id: number): Promise<import("./entities/inventory-session.entity").InventorySession | null>;
    count(id: number, b: {
        componentId: number;
        quantityCounted: number;
        notes?: string;
    }): Promise<import("./entities/inventory-line.entity").InventoryLine | null>;
    close(id: number, u: {
        id: number;
    }): Promise<import("./entities/inventory-session.entity").InventorySession | null>;
}
