import { Repository, EntityManager } from 'typeorm';
import { StockAlert } from './entities/stock-alert.entity';
import { Component } from '../components/entities/component.entity';
export declare class StockAlertsService {
    private readonly alertsRepo;
    private readonly componentsRepo;
    constructor(alertsRepo: Repository<StockAlert>, componentsRepo: Repository<Component>);
    checkAndCreate(manager: EntityManager, warehouseId: number, componentId: number, currentQty: number): Promise<void>;
    checkAndResolve(manager: EntityManager, warehouseId: number, componentId: number, currentQty: number): Promise<void>;
    findActive(warehouseId?: number): Promise<StockAlert[]>;
}
