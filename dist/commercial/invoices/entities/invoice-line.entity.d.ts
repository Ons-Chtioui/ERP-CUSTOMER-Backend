import { Invoice } from './invoice.entity';
import { Product } from '../../../products/entities/product.entity';
export declare class InvoiceLine {
    id: number;
    invoiceId: number;
    invoice: Invoice;
    productId: number | null;
    product: Product | null;
    description: string;
    quantity: number;
    unitPrice: number;
    tvaRate: number;
    discount: number;
    totalHt: number;
    position: number;
    createdAt: Date;
}
