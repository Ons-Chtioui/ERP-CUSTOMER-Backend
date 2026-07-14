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

// MailerService est fourni via le MailerModule global déjà configuré dans AppModule.
// Il n'est PAS besoin de réimporter MailerModule.forRootAsync ici — NestJS le résout
// automatiquement depuis le contexte global si MailerModule est isGlobal ou partagé.
// On utilise le MailerService directement via injection de dépendance.

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
  ],
  providers:   [DocumentsService],
  controllers: [DocumentsController],
  exports:     [DocumentsService],
})
export class DocumentsModule {}
