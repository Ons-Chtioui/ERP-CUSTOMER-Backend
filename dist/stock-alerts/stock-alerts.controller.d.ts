import { StockAlertsService } from './stock-alerts.service';
export declare class StockAlertsController {
    private readonly svc;
    constructor(svc: StockAlertsService);
    findActive(wId?: string): Promise<import("./entities/stock-alert.entity").StockAlert[]>;
}
