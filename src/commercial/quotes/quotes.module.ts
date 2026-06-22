import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { Quote } from './entities/quote.entity';
import { QuoteLine } from './entities/quote-line.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoiceLine } from '../invoices/entities/invoice-line.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quote,
      QuoteLine,
      Invoice,
      InvoiceLine,
    ]),
  ],
  providers: [QuotesService],
  controllers: [QuotesController],
  exports: [QuotesService],
})
export class QuotesModule {}