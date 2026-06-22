import { Invoice } from './invoice.entity';
import { User } from '../../../users/entities/user.entity';
export declare enum PaymentMethod {
    CASH = "cash",
    BANK_TRANSFER = "bank_transfer",
    CHEQUE = "cheque",
    CARD = "card"
}
export declare class Payment {
    id: number;
    invoiceId: number;
    invoice: Invoice;
    amount: number;
    method: PaymentMethod;
    reference: string | null;
    paidAt: string;
    note: string | null;
    createdBy: number;
    creator: User;
    createdAt: Date;
}
