import { Repository, DataSource } from 'typeorm';
import { InventorySession } from './entities/inventory-session.entity';
import { InventoryLine } from './entities/inventory-line.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { Component } from '../components/entities/component.entity';
export declare class InventoryService {
    private readonly sessionsRepo;
    private readonly linesRepo;
    private readonly inventoryRepo;
    private readonly componentsRepo;
    private readonly dataSource;
    constructor(sessionsRepo: Repository<InventorySession>, linesRepo: Repository<InventoryLine>, inventoryRepo: Repository<InventoryItem>, componentsRepo: Repository<Component>, dataSource: DataSource);
    createSession(dto: {
        warehouseId: number;
        nom?: string;
    }, userId: number): Promise<InventorySession>;
    startSession(sessionId: number): Promise<InventorySession | null>;
    countLine(sessionId: number, componentId: number, quantityCounted: number, notes?: string): Promise<InventoryLine | null>;
    closeSession(sessionId: number, userId: number): Promise<InventorySession | null>;
    findAll(warehouseId?: number): Promise<InventorySession[]>;
    findOne(id: number): Promise<InventorySession>;
}
