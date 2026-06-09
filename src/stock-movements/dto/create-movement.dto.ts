import { IsInt, IsPositive, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMovementDto {
  @Type(() => Number) @IsInt()      warehouseId!: number;
  @Type(() => Number) @IsInt()      componentId!: number;
  @Type(() => Number) @IsPositive() quantity!: number;
  @IsOptional() @IsString()         referenceDoc?: string;
  @IsOptional() @IsString()         notes?: string;
}

export class CreateTransferDto extends CreateMovementDto {
  @Type(() => Number) @IsInt() targetWarehouseId!: number;
}