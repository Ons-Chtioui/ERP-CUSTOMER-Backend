import { User } from '../../../users/entities/user.entity';
import { Client } from '../../../clients/entities/client.entity';
import { Order } from '../../../orders/entities/order.entity';
import { Quote } from '../../quotes/entities/quote.entity';
import { InvoiceLine } from './invoice-line.entity';
import { Payment } from './payment.entity';
export declare enum InvoiceStatus {
    DRAFT = "draft",
    SENT = "sent",
    PARTIAL = "partial",
    PAID = "paid",
    OVERDUE = "overdue",
    CANCELLED = "cancelled"
}
export declare enum InvoiceType {
    INVOICE = "invoice",
    CREDIT_NOTE = "credit_note"
}
export declare class Invoice {
    id: number;
    reference: string;
    clientId: number;
    client: Client;
    quoteId: number | null;
    quote: Quote | null;
    orderId: number | null;
    order: Order | null;
    originalInvoiceId: number | null;
    originalInvoice: Invoice | null;
    type: InvoiceType;
    status: InvoiceStatus;
    dueDate: string | null;
    note: string | null;
    discount: number;
    totalHt: number;
    totalTva: number;
    totalTtc: number;
    amountPaid: number;
    createdBy: number;
    creator: User;
    lines: InvoiceLine[];
    payments: Payment[];
    createdAt: Date;
    updatedAt: Date;
}
