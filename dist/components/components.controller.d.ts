import { ComponentsService } from './components.service';
import { CreateComponentDto } from './dto/create-component.dto';
export declare class ComponentsController {
    private readonly svc;
    constructor(svc: ComponentsService);
    findAll(search?: string, categoryId?: string, supplierId?: string): Promise<import("./entities/component.entity").Component[]>;
    categories(): Promise<import("./entities/category.entity").Category[]>;
    suppliers(): Promise<import("./entities/supplier.entity").Supplier[]>;
    findOne(id: number): Promise<import("./entities/component.entity").Component>;
    stock(id: number): Promise<{
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
    create(dto: CreateComponentDto): Promise<import("./entities/component.entity").Component>;
    update(id: number, dto: Partial<CreateComponentDto>): Promise<import("./entities/component.entity").Component>;
    remove(id: number): Promise<import("./entities/component.entity").Component>;
    createCategory(b: {
        nom: string;
        description?: string;
    }): Promise<import("./entities/category.entity").Category>;
    createSupplier(b: any): Promise<import("./entities/supplier.entity").Supplier>;
}
