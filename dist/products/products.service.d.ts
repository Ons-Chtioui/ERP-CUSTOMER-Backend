import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { BomLine } from './entities/bom-line.entity';
import { ProductionLog } from './entities/production-log.entity';
import { ProductInventory } from './entities/product-inventory.entity';
import { Component } from '../components/entities/component.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { Warehouse } from '../warehouses/entities/warehouse.entity';
import { ProductCategory } from '../product-categories/entities/product-category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { SetBomDto } from './dto/set-bom.dto';
import { ProduceDto } from './dto/produce.dto';
export declare class ProductsService {
    private readonly productsRepo;
    private readonly bomRepo;
    private readonly logsRepo;
    private readonly productInventoryRepo;
    private readonly inventoryRepo;
    private readonly componentsRepo;
    private readonly warehousesRepo;
    private readonly categoriesRepo;
    private readonly dataSource;
    constructor(productsRepo: Repository<Product>, bomRepo: Repository<BomLine>, logsRepo: Repository<ProductionLog>, productInventoryRepo: Repository<ProductInventory>, inventoryRepo: Repository<InventoryItem>, componentsRepo: Repository<Component>, warehousesRepo: Repository<Warehouse>, categoriesRepo: Repository<ProductCategory>, dataSource: DataSource);
    findAll(filter?: {
        categoryId?: number;
        parentId?: number;
        search?: string;
    }): Promise<Product[]>;
    findOne(id: number): Promise<Product>;
    create(dto: CreateProductDto): Promise<Product>;
    update(id: number, dto: Partial<CreateProductDto>): Promise<Product>;
    archive(id: number): Promise<Product>;
    getBom(productId: number): Promise<BomLine[]>;
    setBom(productId: number, dto: SetBomDto): Promise<BomLine[]>;
    upsertBomLine(productId: number, componentId: number, quantity: number): Promise<BomLine>;
    deleteBomLine(productId: number, componentId: number): Promise<void>;
    recalcCoutRevient(productId: number): Promise<void>;
    recalcForComponent(componentId: number): Promise<void>;
    getAvailability(productId: number, warehouseId?: number): Promise<{
        stockDisponible: number;
        goulot: {
            componentId: number;
            nom: string;
            fabricable: number;
        } | null;
        details: {
            componentId: number;
            nom: string;
            reference: string;
            qteBom: number;
            stockDispo: number;
            fabricable: number;
            isGoulot: boolean;
        }[];
    }>;
    getFinishedStockTotal(productId: number): Promise<number>;
    getOrderStockSummary(productId: number): Promise<{
        stockFini: number;
        stockFabricable: number;
        stockTotal: number;
        goulot: {
            componentId: number;
            nom: string;
            fabricable: number;
        } | null;
    }>;
    getFulfillmentPreview(productId: number, quantity: number): Promise<{
        productId: number;
        productName: string;
        quantity: number;
        stockFini: number;
        stockFabricable: number;
        stockTotal: number;
        fromStock: number;
        fromAssembly: number;
        canFulfill: boolean;
        missing: number;
        source: string;
    }>;
    findAllWithStock(filter?: {
        categoryId?: number;
        parentId?: number;
        search?: string;
    }): Promise<{
        stock: {
            stockFini: number;
            stockFabricable: number;
            stockTotal: number;
            goulot: {
                componentId: number;
                nom: string;
                fabricable: number;
            } | null;
        };
        id: number;
        nom: string;
        reference: string;
        description: string;
        unite: string;
        prixVente: number;
        prixVenteAuto: number;
        coutRevient: number;
        coutMO: number;
        seuilAlerte: number;
        imageUrl: string | null;
        isActive: boolean;
        parent: Product | null;
        variants: Product[];
        category: ProductCategory | null;
        bomLines: BomLine[];
        productionLogs: ProductionLog[];
        inventory: ProductInventory[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    simulate(productId: number, quantity: number, warehouseId: number): Promise<{
        canProduce: boolean;
        quantity: number;
        coutUnitaire: number;
        coutTotal: number;
        manquants: {
            componentId: number;
            nom: string;
            requis: number;
            dispo: number;
            manque: number;
        }[];
    }>;
    produce(productId: number, dto: ProduceDto, userId: number): Promise<ProductionLog>;
    getProductInventory(productId: number): Promise<ProductInventory[]>;
    transferProductStock(productId: number, fromWarehouseId: number, toWarehouseId: number, quantity: number, userId: number): Promise<void>;
    getProductionLogs(productId: number): Promise<ProductionLog[]>;
}
