import { OrderStatus } from '../entities/order.entity';
export declare class UpdateOrderStatusDto {
    status: OrderStatus;
    comment?: string;
}
