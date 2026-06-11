import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
export declare class ProductCategoriesService {
    private readonly repo;
    constructor(repo: Repository<ProductCategory>);
    findAll(): Promise<ProductCategory[]>;
    findOne(id: number): Promise<ProductCategory>;
    create(dto: CreateProductCategoryDto): Promise<ProductCategory>;
    update(id: number, dto: Partial<CreateProductCategoryDto>): Promise<ProductCategory>;
    remove(id: number): Promise<void>;
}
