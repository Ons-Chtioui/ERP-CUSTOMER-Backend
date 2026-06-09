export declare class CreateMovementDto {
    warehouseId: number;
    componentId: number;
    quantity: number;
    referenceDoc?: string;
    notes?: string;
}
export declare class CreateTransferDto extends CreateMovementDto {
    targetWarehouseId: number;
}
