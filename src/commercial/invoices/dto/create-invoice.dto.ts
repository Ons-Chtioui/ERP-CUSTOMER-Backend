import { Type } from 'class-transformer';
import {
  IsInt,
  IsPositive,
  IsNumber,
  IsString,
  IsOptional,
  IsDateString,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  Min,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateInvoiceLineDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  productId?: number;

  @IsString()
  @MaxLength(300)
  description!: string;

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
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tvaRate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class CreateInvoiceDto {
  @IsInt()
  @IsPositive()
  clientId!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  quoteId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  orderId?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

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
  @Type(() => CreateInvoiceLineDto)
  lines!: CreateInvoiceLineDto[];
}