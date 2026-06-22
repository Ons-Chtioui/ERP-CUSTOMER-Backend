export declare class CreateOrderSupplementDto {
    componentId: number;
    quantity: number;
    unitPrice: number;
    tvaRate?: number;
    note?: string;
}
export declare class CreateOrderLineDto {
    productId: number;
    quantity: number;
    discount?: number;
    supplements?: CreateOrderSupplementDto[];
}
export declare class CreateOrderDto {
    clientId: number;
    warehouseId: number;
    note?: string;
    discount?: number;
    lines: CreateOrderLineDto[];
}
