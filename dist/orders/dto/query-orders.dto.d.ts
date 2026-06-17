import { OrderStatus } from '../entities/order.entity';
export declare class QueryOrdersDto {
    status?: OrderStatus;
    clientId?: number;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}
