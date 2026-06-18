import { OrderLine } from './order-line.entity';
import { Component } from '../../components/entities/component.entity';
export declare class OrderLineSupplement {
    id: number;
    orderLineId: number;
    orderLine: OrderLine;
    componentId: number;
    component: Component;
    quantity: number;
    unitPrice: number;
    tvaRate: number;
    totalHt: number;
    qtyDeducted: number;
    note: string | null;
    createdAt: Date;
}
