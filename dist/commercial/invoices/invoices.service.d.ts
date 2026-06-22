import { Repository, DataSource } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { Payment } from './entities/payment.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { DocumentsService } from '../../documents/documents.service';
export declare class InvoicesService {
    private invoiceRepo;
    private lineRepo;
    private paymentRepo;
    private readonly dataSource;
    private readonly documentsService;
    constructor(invoiceRepo: Repository<Invoice>, lineRepo: Repository<InvoiceLine>, paymentRepo: Repository<Payment>, dataSource: DataSource, documentsService: DocumentsService);
    private generateReference;
    private computeTotals;
    create(dto: CreateInvoiceDto, userId: number): Promise<Invoice>;
    findAll(query: QueryInvoicesDto): Promise<{
        data: Invoice[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<Invoice>;
    markSent(id: number): Promise<Invoice>;
    addPayment(id: number, dto: AddPaymentDto, userId: number): Promise<Invoice>;
    createCreditNote(id: number, userId: number, reason?: string): Promise<Invoice>;
    cancel(id: number): Promise<Invoice>;
    checkOverdue(): Promise<void>;
    getStats(): Promise<any[]>;
}
