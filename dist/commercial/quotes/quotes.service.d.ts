import { Repository, DataSource } from 'typeorm';
import { Quote } from './entities/quote.entity';
import { QuoteLine } from './entities/quote-line.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoiceLine } from '../invoices/entities/invoice-line.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';
export declare class QuotesService {
    private quoteRepo;
    private lineRepo;
    private invoiceRepo;
    private invoiceLineRepo;
    private readonly dataSource;
    constructor(quoteRepo: Repository<Quote>, lineRepo: Repository<QuoteLine>, invoiceRepo: Repository<Invoice>, invoiceLineRepo: Repository<InvoiceLine>, dataSource: DataSource);
    private generateReference;
    private computeTotals;
    create(dto: CreateQuoteDto, userId: number): Promise<Quote>;
    findAll(query: QueryQuotesDto): Promise<{
        data: Quote[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<Quote>;
    updateStatus(id: number, dto: UpdateQuoteStatusDto): Promise<Quote>;
    convertToInvoice(id: number, userId: number): Promise<Invoice>;
    remove(id: number): Promise<void>;
    markExpiredQuotes(): Promise<void>;
}
