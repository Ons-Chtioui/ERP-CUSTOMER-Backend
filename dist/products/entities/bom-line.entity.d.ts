import { Product } from './product.entity';
import { Component } from '../../components/entities/component.entity';
export declare class BomLine {
    id: number;
    product: Product;
    component: Component;
    quantity: number;
}
