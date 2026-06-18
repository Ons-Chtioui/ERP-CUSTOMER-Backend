export declare class CreateOrderLineDto {
    productId: number;
    quantity: number;
    discount?: number;
    supplements?: CreateOrderSupplementDto[];
}
export declare class CreateOrderDto {
    clientId: number;
    note?: string;
    discount?: number;
    lines: CreateOrderLineDto[];
}
export declare class CreateOrderSupplementDto {
    componentId: number;
    quantity: number;
    unitPrice: number;
    tvaRate?: number;
    note?: string;
}
