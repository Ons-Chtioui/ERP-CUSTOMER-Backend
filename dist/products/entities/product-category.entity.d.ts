import { Product } from './product.entity';
export declare class ProductCategory {
    id: number;
    nom: string;
    description: string;
    products: Product[];
    createdAt: Date;
}
