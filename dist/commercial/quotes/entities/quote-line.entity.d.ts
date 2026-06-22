import { Quote } from './quote.entity';
import { Product } from '../../../products/entities/product.entity';
export declare class QuoteLine {
    id: number;
    quoteId: number;
    quote: Quote;
    productId: number;
    product: Product;
    description: string | null;
    quantity: number;
    unitPrice: number;
    tvaRate: number;
    discount: number;
    totalHt: number;
    position: number;
    createdAt: Date;
}
