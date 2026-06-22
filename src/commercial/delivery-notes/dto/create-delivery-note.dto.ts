// src/commercial/delivery-notes/dto/create-delivery-note.dto.ts
import { Type } from 'class-transformer';
import {
  IsArray, ArrayMinSize, IsInt, IsPositive,
  IsNumber, IsOptional, IsString, Min,
  ValidateNested,
} from 'class-validator';

export class CreateDeliveryNoteLineDto {
  @IsInt()
  @IsPositive()
  productId!: number;

  @IsNumber()
  @Min(0)
  quantityOrdered!: number;

  @IsNumber()
  @Min(0)
  quantityDelivered!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class CreateDeliveryNoteDto {
  @IsInt()
  @IsPositive()
  clientId!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  orderId?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  invoiceId?: number;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateDeliveryNoteLineDto)
  lines!: CreateDeliveryNoteLineDto[];
}