import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';
export declare class QuotesController {
    private readonly service;
    constructor(service: QuotesService);
    create(dto: CreateQuoteDto, req: any): Promise<import("./entities/quote.entity").Quote>;
    findAll(query: QueryQuotesDto): Promise<{
        data: import("./entities/quote.entity").Quote[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/quote.entity").Quote>;
    updateStatus(id: number, dto: UpdateQuoteStatusDto): Promise<import("./entities/quote.entity").Quote>;
    convertToInvoice(id: number, req: any): Promise<import("../invoices/entities/invoice.entity").Invoice>;
    remove(id: number): Promise<void>;
}
