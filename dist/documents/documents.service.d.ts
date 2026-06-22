import { MailerService } from '@nestjs-modules/mailer';
import { Repository, DataSource } from 'typeorm';
import { Quote } from '../commercial/quotes/entities/quote.entity';
import { Invoice } from '../commercial/invoices/entities/invoice.entity';
import { DeliveryNote } from '../commercial/delivery-notes/entities/delivery-note.entity';
import { Order } from '../orders/entities/order.entity';
import { InventorySession } from '../inventory/entities/inventory-session.entity';
export declare class DocumentsService {
    private quoteRepo;
    private invoiceRepo;
    private dnRepo;
    private orderRepo;
    private invSessionRepo;
    private readonly mailer;
    private readonly dataSource;
    constructor(quoteRepo: Repository<Quote>, invoiceRepo: Repository<Invoice>, dnRepo: Repository<DeliveryNote>, orderRepo: Repository<Order>, invSessionRepo: Repository<InventorySession>, mailer: MailerService, dataSource: DataSource);
    generateQuotePdf(id: number): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    generateInvoicePdf(id: number): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    generateDeliveryNotePdf(id: number): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    generateOrderPdf(id: number): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    generateInventoryPdf(sessionId: number): Promise<{
        buffer: Buffer;
        filename: string;
    }>;
    sendQuoteEmail(id: number): Promise<Quote>;
    sendInvoiceEmail(id: number): Promise<Invoice>;
    restoreStockForCreditNote(creditNoteId: number): Promise<void>;
}
