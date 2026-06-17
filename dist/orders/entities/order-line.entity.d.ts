import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
export declare class OrderLine {
    id: number;
    orderId: number;
    order: Order;
    productId: number;
    product: Product;
    quantity: number;
    qtyFromStock: number;
    qtyFromAssembly: number;
    unitPrice: number;
    tvaRate: number;
    discount: number;
    totalHt: number;
    createdAt: Date;
}
