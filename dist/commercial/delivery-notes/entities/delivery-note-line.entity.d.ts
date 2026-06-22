import { DeliveryNote } from './delivery-note.entity';
import { Product } from '../../../products/entities/product.entity';
export declare class DeliveryNoteLine {
    id: number;
    deliveryNoteId: number;
    deliveryNote: DeliveryNote;
    productId: number;
    product: Product;
    quantityOrdered: number;
    quantityDelivered: number;
    position: number;
}
