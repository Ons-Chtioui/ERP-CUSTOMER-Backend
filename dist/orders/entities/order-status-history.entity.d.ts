import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';
export declare class OrderStatusHistory {
    id: number;
    orderId: number;
    order: Order;
    fromStatus: string | null;
    toStatus: string;
    changedBy: number;
    user: User;
    comment: string | null;
    createdAt: Date;
}
