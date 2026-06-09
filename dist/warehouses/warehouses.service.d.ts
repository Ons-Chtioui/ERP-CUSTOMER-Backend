import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
export declare class WarehousesService {
    private readonly warehousesRepo;
    private readonly inventoryRepo;
    constructor(warehousesRepo: Repository<Warehouse>, inventoryRepo: Repository<InventoryItem>);
    findAll(): Promise<Warehouse[]>;
    findOne(id: number): Promise<Warehouse>;
    create(dto: CreateWarehouseDto): Promise<Warehouse>;
    update(id: number, dto: Partial<CreateWarehouseDto>): Promise<Warehouse>;
    toggleActive(id: number): Promise<Warehouse>;
    getStock(warehouseId: number): Promise<InventoryItem[]>;
    getGlobalSummary(): Promise<{
        warehouse: Warehouse;
        totalItems: number;
        totalQuantity: number;
        totalValue: number;
    }[]>;
}
