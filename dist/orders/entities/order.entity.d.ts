import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';
import { OrderLine } from './order-line.entity';
import { OrderStatusHistory } from './order-status-history.entity';
export declare enum OrderStatus {
    DRAFT = "draft",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    SHIPPED = "shipped",
    DELIVERED = "delivered",
    CANCELLED = "cancelled"
}
export declare class Order {
    id: number;
    reference: string;
    clientId: number;
    client: Client;
    status: OrderStatus;
    note: string | null;
    discount: number;
    totalHt: number;
    totalTva: number;
    totalTtc: number;
    confirmedAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
    cancelledBy: number | null;
    createdBy: number;
    creator: User;
    lines: OrderLine[];
    statusHistory: OrderStatusHistory[];
    createdAt: Date;
    updatedAt: Date;
}
