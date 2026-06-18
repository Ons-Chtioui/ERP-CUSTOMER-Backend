import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';
import { OrderLineSupplement } from './order-line-supplement.entity';
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
    supplements: OrderLineSupplement[];
    createdAt: Date;
}
