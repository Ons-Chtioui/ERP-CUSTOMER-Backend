import { IsString, IsOptional, IsNumber, IsInt, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateComponentDto {
  @IsString() @MaxLength(150) 
  nom!: string;
  @IsString() @MaxLength(80)  
  reference!: string;
  @IsOptional() @IsString()   
  description?: string;
  @IsOptional() @IsString() @MaxLength(20) 
  unite?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) 
  prixAchat?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)    
  seuilAlerte?: number;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @Type(() => Number) @IsInt() 
  categoryId?: number;
  @IsOptional() @Type(() => Number) @IsInt() 
  supplierId?: number;
}