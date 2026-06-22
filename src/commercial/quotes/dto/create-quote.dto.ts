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

export class CreateQuoteLineDto {
  @IsInt()
  @IsPositive()
  productId!: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

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

export class CreateQuoteDto {
  @IsInt()
  @IsPositive()
  clientId!: number;

  @IsDateString()
  validUntil!: string;

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
  @Type(() => CreateQuoteLineDto)
  lines!: CreateQuoteLineDto[];
}