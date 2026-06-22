import { InvoiceStatus, InvoiceType } from '../entities/invoice.entity';
export declare class QueryInvoicesDto {
    status?: InvoiceStatus;
    type?: InvoiceType;
    clientId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}
