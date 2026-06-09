import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
export declare class WarehousesController {
    private readonly svc;
    constructor(svc: WarehousesService);
    findAll(): Promise<import("./entities/warehouse.entity").Warehouse[]>;
    summary(): Promise<{
        warehouse: import("./entities/warehouse.entity").Warehouse;
        totalItems: number;
        totalQuantity: number;
        totalValue: number;
    }[]>;
    findOne(id: number): Promise<import("./entities/warehouse.entity").Warehouse>;
    getStock(id: number): Promise<import("../components/entities/inventory-item.entity").InventoryItem[]>;
    create(dto: CreateWarehouseDto): Promise<import("./entities/warehouse.entity").Warehouse>;
    update(id: number, dto: Partial<CreateWarehouseDto>): Promise<import("./entities/warehouse.entity").Warehouse>;
    toggle(id: number): Promise<import("./entities/warehouse.entity").Warehouse>;
}
