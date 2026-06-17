import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { SetBomDto } from './dto/set-bom.dto';
import { ProduceDto } from './dto/produce.dto';
export declare class ProductsController {
    private readonly svc;
    constructor(svc: ProductsService);
    findAll(search?: string, categoryId?: string, parentId?: string, withStock?: string): Promise<import("./entities/product.entity").Product[]>;
    findOne(id: number): Promise<import("./entities/product.entity").Product>;
    create(dto: CreateProductDto): Promise<import("./entities/product.entity").Product>;
    update(id: number, dto: Partial<CreateProductDto>): Promise<import("./entities/product.entity").Product>;
    archive(id: number): Promise<import("./entities/product.entity").Product>;
    getBom(id: number): Promise<import("./entities/bom-line.entity").BomLine[]>;
    setBom(id: number, dto: SetBomDto): Promise<import("./entities/bom-line.entity").BomLine[]>;
    upsertBomLine(id: number, componentId: number, quantity: number): Promise<import("./entities/bom-line.entity").BomLine>;
    deleteBomLine(id: number, componentId: number): Promise<void>;
    getAvailability(id: number, warehouseId?: string): Promise<{
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
    getFulfillmentPreview(id: number, quantity: string): Promise<{
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
    simulate(id: number, body: {
        quantity: number;
        warehouseId: number;
    }): Promise<{
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
    produce(id: number, dto: ProduceDto, user: {
        id: number;
    }): Promise<import("./entities/production-log.entity").ProductionLog>;
    getLogs(id: number): Promise<import("./entities/production-log.entity").ProductionLog[]>;
    getInventory(id: number): Promise<import("./entities/product-inventory.entity").ProductInventory[]>;
    transferStock(id: number, body: {
        fromWarehouseId: number;
        toWarehouseId: number;
        quantity: number;
    }, user: {
        id: number;
    }): Promise<void>;
}
