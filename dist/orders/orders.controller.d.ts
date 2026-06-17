import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderLinesDto } from './dto/update-order-lines.dto';
export declare class OrdersController {
    private readonly service;
    constructor(service: OrdersService);
    create(dto: CreateOrderDto, user: {
        id: number;
    }): Promise<import("./entities/order.entity").Order>;
    findAll(query: QueryOrdersDto): Promise<{
        data: import("./entities/order.entity").Order[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(): Promise<{
        stats: {
            status: string;
            count: string;
            total: string;
        }[];
        totalOrders: number;
        totalRevenue: number;
        avgOrderValue: number;
    }>;
    previewLineFulfillment(productId: number, quantity: number): Promise<{
        productId: number;
        productName: string;
        quantity: number;
        stockFini: number;
        stockFabricable: number;
        stockTotal: number;
        fromStock: number;
        fromAssembly: number;
        canFulfill: boolean;
        missing: number;
        source: string;
    }>;
    findOne(id: number): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: number, dto: UpdateOrderStatusDto, user: {
        id: number;
    }): Promise<import("./entities/order.entity").Order>;
    updateLines(id: number, dto: UpdateOrderLinesDto, user: {
        id: number;
    }): Promise<import("./entities/order.entity").Order>;
    checkAvailability(id: number): Promise<{
        orderId: number;
        reference: string;
        canConfirm: boolean;
        lines: object[];
        missing: object[];
    }>;
    remove(id: number): Promise<void>;
}
