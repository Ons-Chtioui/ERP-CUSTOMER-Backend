export declare class CreateDeliveryNoteLineDto {
    productId: number;
    quantityOrdered: number;
    quantityDelivered: number;
    position?: number;
}
export declare class CreateDeliveryNoteDto {
    clientId: number;
    orderId?: number;
    invoiceId?: number;
    deliveryAddress?: string;
    note?: string;
    lines: CreateDeliveryNoteLineDto[];
}
