import { Repository } from 'typeorm';
import { Component } from './entities/component.entity';
import { Category } from './entities/category.entity';
import { Supplier } from './entities/supplier.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { CreateComponentDto } from './dto/create-component.dto';
export declare class ComponentsService {
    private readonly componentsRepo;
    private readonly categoriesRepo;
    private readonly suppliersRepo;
    private readonly inventoryRepo;
    constructor(componentsRepo: Repository<Component>, categoriesRepo: Repository<Category>, suppliersRepo: Repository<Supplier>, inventoryRepo: Repository<InventoryItem>);
    findAll(filter: {
        search?: string;
        categoryId?: number;
        supplierId?: number;
    }): Promise<Component[]>;
    findOne(id: number): Promise<Component>;
    findByReference(ref: string): Promise<Component>;
    create(dto: CreateComponentDto): Promise<Component>;
    update(id: number, dto: Partial<CreateComponentDto>): Promise<Component>;
    deactivate(id: number): Promise<Component>;
    updateImageUrl(id: number, imageUrl: string): Promise<Component>;
    getStockSummary(componentId: number): Promise<{
        componentId: number;
        totalQuantity: number;
        isLowStock: boolean;
        threshold: number;
        byWarehouse: {
            warehouse: import("../warehouses/entities/warehouse.entity").Warehouse;
            quantity: number;
            reservedQty: number;
            available: number;
        }[];
    }>;
    findAllCategories(): Promise<Category[]>;
    createCategory(nom: string, description?: string): Promise<Category>;
    findAllSuppliers(): Promise<Supplier[]>;
    createSupplier(data: Partial<Supplier>): Promise<Supplier>;
}
