import { Product } from '../../products/entities/product.entity';
export declare class ProductCategory {
    id: number;
    nom: string;
    couleur: string;
    description: string;
    products: Product[];
    createdAt: Date;
}
