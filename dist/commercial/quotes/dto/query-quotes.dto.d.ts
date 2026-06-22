import { QuoteStatus } from '../entities/quote.entity';
export declare class QueryQuotesDto {
    status?: QuoteStatus;
    clientId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}
