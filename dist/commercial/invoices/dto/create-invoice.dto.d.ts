export declare class CreateInvoiceLineDto {
    productId?: number;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tvaRate?: number;
    position?: number;
}
export declare class CreateInvoiceDto {
    clientId: number;
    quoteId?: number;
    orderId?: number;
    dueDate?: string;
    note?: string;
    discount?: number;
    lines: CreateInvoiceLineDto[];
}
