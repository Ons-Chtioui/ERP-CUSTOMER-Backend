import { Order } from './order.entity';
import { User } from '../../users/entities/user.entity';
export declare class OrderModification {
    id: number;
    orderId: number;
    order: Order;
    action: string;
    details: string | null;
    changedBy: number;
    user: User;
    createdAt: Date;
}
