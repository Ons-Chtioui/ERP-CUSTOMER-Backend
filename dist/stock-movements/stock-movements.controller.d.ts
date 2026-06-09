import { StockMovementsService } from './stock-movements.service';
import { CreateMovementDto, CreateTransferDto } from './dto/create-movement.dto';
import { MovementType } from './entities/stock-movement.entity';
export declare class StockMovementsController {
    private readonly svc;
    constructor(svc: StockMovementsService);
    findHistory(wId?: string, cId?: string, type?: MovementType, limit?: string): Promise<import("./entities/stock-movement.entity").StockMovement[]>;
    createIn(dto: CreateMovementDto, u: {
        id: number;
    }): Promise<import("./entities/stock-movement.entity").StockMovement>;
    createOut(dto: CreateMovementDto, u: {
        id: number;
    }): Promise<import("./entities/stock-movement.entity").StockMovement>;
    createTransfer(dto: CreateTransferDto, u: {
        id: number;
    }): Promise<{
        outMov: import("./entities/stock-movement.entity").StockMovement;
        inMov: import("./entities/stock-movement.entity").StockMovement;
    }>;
}
