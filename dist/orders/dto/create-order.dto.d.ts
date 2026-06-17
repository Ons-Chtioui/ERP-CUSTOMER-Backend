export declare class CreateOrderLineDto {
    productId: number;
    quantity: number;
    discount?: number;
}
export declare class CreateOrderDto {
    clientId: number;
    note?: string;
    discount?: number;
    lines: CreateOrderLineDto[];
}
