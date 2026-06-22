import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto';
export declare class InvoicesController {
    private readonly service;
    constructor(service: InvoicesService);
    create(dto: CreateInvoiceDto, req: any): Promise<import("./entities/invoice.entity").Invoice>;
    findAll(query: QueryInvoicesDto): Promise<{
        data: import("./entities/invoice.entity").Invoice[];
        total: number;
        page: number;
        limit: number;
    }>;
    getStats(): Promise<any[]>;
    findOne(id: number): Promise<import("./entities/invoice.entity").Invoice>;
    markSent(id: number): Promise<import("./entities/invoice.entity").Invoice>;
    addPayment(id: number, dto: AddPaymentDto, req: any): Promise<import("./entities/invoice.entity").Invoice>;
    createCreditNote(id: number, dto: CreateCreditNoteDto, req: any): Promise<import("./entities/invoice.entity").Invoice>;
    cancel(id: number): Promise<import("./entities/invoice.entity").Invoice>;
}
