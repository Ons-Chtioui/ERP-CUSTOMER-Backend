import { IsOptional, IsEnum, IsInt, IsPositive, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceStatus, InvoiceType } from '../entities/invoice.entity';

export class QueryInvoicesDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsEnum(InvoiceType)
  type?: InvoiceType;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  clientId?: number;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}