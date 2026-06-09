// src/warehouses/dto/create-warehouse.dto.ts
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateWarehouseDto {
  @IsString() @MaxLength(100)
   nom!: string;
  @IsString() @MaxLength(20) 
   code!: string;
  @IsOptional() @IsString()  
   adresse?: string;
  @IsOptional() @IsString() @MaxLength(100)
   ville?: string;
  @IsOptional() @IsString() @MaxLength(60)  
  pays?: string;
}