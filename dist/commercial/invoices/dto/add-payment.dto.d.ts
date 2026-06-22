import { PaymentMethod } from '../entities/payment.entity';
export declare class AddPaymentDto {
    amount: number;
    method: PaymentMethod;
    reference?: string;
    paidAt?: string;
    note?: string;
}
