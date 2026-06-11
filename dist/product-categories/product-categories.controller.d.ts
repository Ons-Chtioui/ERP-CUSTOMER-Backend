import { ProductCategoriesService } from './product-categories.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
export declare class ProductCategoriesController {
    private readonly svc;
    constructor(svc: ProductCategoriesService);
    findAll(): Promise<import("./entities/product-category.entity").ProductCategory[]>;
    findOne(id: number): Promise<import("./entities/product-category.entity").ProductCategory>;
    create(dto: CreateProductCategoryDto): Promise<import("./entities/product-category.entity").ProductCategory>;
    update(id: number, dto: Partial<CreateProductCategoryDto>): Promise<import("./entities/product-category.entity").ProductCategory>;
    remove(id: number): Promise<void>;
}
