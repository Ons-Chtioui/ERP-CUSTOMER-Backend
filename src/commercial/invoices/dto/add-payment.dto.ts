import { IsEnum, IsNumber, IsOptional, IsString, IsDateString, Min, MaxLength } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class AddPaymentDto {
  @IsNumber()
  @Min(0.001)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  note?: string;
}