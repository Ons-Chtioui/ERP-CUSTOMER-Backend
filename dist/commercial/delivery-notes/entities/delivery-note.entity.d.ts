import { User } from '../../../users/entities/user.entity';
import { Client } from '../../../clients/entities/client.entity';
import { Order } from '../../../orders/entities/order.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { DeliveryNoteLine } from './delivery-note-line.entity';
export declare enum DeliveryStatus {
    PENDING = "pending",
    DELIVERED = "delivered",
    SIGNED = "signed"
}
export declare class DeliveryNote {
    id: number;
    reference: string;
    clientId: number;
    client: Client;
    orderId: number | null;
    order: Order | null;
    invoiceId: number | null;
    invoice: Invoice | null;
    status: DeliveryStatus;
    deliveryAddress: string | null;
    deliveredAt: Date | null;
    signatureUrl: string | null;
    note: string | null;
    createdBy: number;
    creator: User;
    lines: DeliveryNoteLine[];
    createdAt: Date;
    updatedAt: Date;
}
