export declare class CreateQuoteLineDto {
    productId: number;
    description?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    tvaRate?: number;
    position?: number;
}
export declare class CreateQuoteDto {
    clientId: number;
    validUntil: string;
    note?: string;
    discount?: number;
    lines: CreateQuoteLineDto[];
}
