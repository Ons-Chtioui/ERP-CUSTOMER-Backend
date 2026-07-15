import { Module }         from '@nestjs/common';
import { TypeOrmModule }  from '@nestjs/typeorm';
import { DocumentsService }    from './documents.service';
import { DocumentsController } from './documents.controller';

import { Quote }           from '../commercial/quotes/entities/quote.entity';
import { Invoice }         from '../commercial/invoices/entities/invoice.entity';
import { DeliveryNote }    from '../commercial/delivery-notes/entities/delivery-note.entity';
import { Order }           from '../orders/entities/order.entity';
import { InventorySession } from '../inventory/entities/inventory-session.entity';
import { InventoryLine }   from '../inventory/entities/inventory-line.entity';
import { ProductInventory } from '../products/entities/product-inventory.entity';
import { BomLine }         from '../products/entities/bom-line.entity';
import { InventoryItem }   from '../components/entities/inventory-item.entity';

// FIX Bug #4 : import EmailsModule pour déléguer l'envoi d'emails à EmailsService
// (au lieu d'appeler MailerService directement, ce qui court-circuitait logs/queue/SSE)
import { EmailsModule } from '../emails/emails.module';

// MailerService est fourni globalement via MailerModule (isGlobal: true) dans AppModule.
// EmailsService est fourni via EmailsModule importé ci-dessous.

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quote,
      Invoice,
      DeliveryNote,
      Order,
      InventorySession,
      InventoryLine,
      ProductInventory,
      BomLine,
      InventoryItem,
    ]),
    EmailsModule,
  ],
  providers:   [DocumentsService],
  controllers: [DocumentsController],
  exports:     [DocumentsService],
})
export class DocumentsModule {}
