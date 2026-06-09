import { Repository, DataSource } from 'typeorm';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { StockAlertsService } from '../stock-alerts/stock-alerts.service';
import { CreateMovementDto, CreateTransferDto } from './dto/create-movement.dto';
export declare class StockMovementsService {
    private readonly movementsRepo;
    private readonly inventoryRepo;
    private readonly dataSource;
    private readonly alertsService;
    constructor(movementsRepo: Repository<StockMovement>, inventoryRepo: Repository<InventoryItem>, dataSource: DataSource, alertsService: StockAlertsService);
    createIn(dto: CreateMovementDto, userId: number): Promise<StockMovement>;
    createOut(dto: CreateMovementDto, userId: number): Promise<StockMovement>;
    createTransfer(dto: CreateTransferDto, userId: number): Promise<{
        outMov: StockMovement;
        inMov: StockMovement;
    }>;
    findHistory(filters: {
        warehouseId?: number;
        componentId?: number;
        type?: MovementType;
        limit?: number;
    }): Promise<StockMovement[]>;
    private getOrCreate;
    private getOrFail;
}
