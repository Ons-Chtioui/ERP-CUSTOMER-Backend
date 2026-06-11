import { ProductCategory } from '../../product-categories/entities/product-category.entity';
import { BomLine } from './bom-line.entity';
import { ProductionLog } from './production-log.entity';
import { ProductInventory } from './product-inventory.entity';
export declare class Product {
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
}
