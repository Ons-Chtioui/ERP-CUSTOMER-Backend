import { Type } from 'class-transformer';
import {
  IsOptional, IsString, IsNumber,
  IsInt, Min, Max, ValidateNested, ArrayMinSize, IsArray,
} from 'class-validator';

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
}


export class CreateOrderDto {
  @IsInt()
  @Min(1)
  clientId!: number;

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