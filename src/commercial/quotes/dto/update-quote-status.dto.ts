import { IsEnum, IsOptional, IsString } from 'class-validator';
import { QuoteStatus } from '../entities/quote.entity';

export class UpdateQuoteStatusDto {
  @IsEnum(QuoteStatus)
  status!: QuoteStatus;

  @IsOptional()
  @IsString()
  comment?: string;
}