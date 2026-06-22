// src/commercial/delivery-notes/dto/deliver.dto.ts
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeliverDto {
 
  @IsOptional()
  @IsString()
  @MaxLength(500)
  signatureUrl?: string;

  @IsOptional()
  @IsString()
  note?: string;
}