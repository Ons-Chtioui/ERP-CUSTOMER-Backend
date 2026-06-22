import { User } from '../../../users/entities/user.entity';
import { Client } from '../../../clients/entities/client.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { QuoteLine } from './quote-line.entity';
export declare enum QuoteStatus {
    DRAFT = "draft",
    SENT = "sent",
    ACCEPTED = "accepted",
    REFUSED = "refused",
    EXPIRED = "expired",
    CONVERTED = "converted"
}
export declare class Quote {
    id: number;
    reference: string;
    clientId: number;
    client: Client;
    status: QuoteStatus;
    validUntil: string;
    note: string | null;
    discount: number;
    totalHt: number;
    totalTva: number;
    totalTtc: number;
    convertedTo: number | null;
    convertedInvoice: Invoice | null;
    convertedAt: Date | null;
    createdBy: number;
    creator: User;
    lines: QuoteLine[];
    createdAt: Date;
    updatedAt: Date;
}
