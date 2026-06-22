import { Type } from 'class-transformer';
import {
  IsOptional, IsString, IsNumber,
  IsInt, Min, Max, ValidateNested, ArrayMinSize, IsArray,
} from 'class-validator';

export class CreateOrderSupplementDto {
  @IsInt()
  @Min(1)
  componentId!: number;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tvaRate?: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateOrderLineDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderSupplementDto)
  supplements?: CreateOrderSupplementDto[];
}

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  clientId!: number;

  // Entrepôt obligatoire : détermine le stock affiché ET la déduction
  @IsInt()
  @Min(1)
  warehouseId!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderLineDto)
  lines!: CreateOrderLineDto[];
}