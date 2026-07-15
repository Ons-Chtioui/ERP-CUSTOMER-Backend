// src/emails/emails.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule }    from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule }     from '@nestjs/schedule';

// Entités
import { EmailLog }      from './entities/email-log.entity';
import { Invoice }       from '../commercial/invoices/entities/invoice.entity';
import { Component }     from '../components/entities/component.entity';
import { User }          from '../users/entities/user.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';

// FIX Bug #3 : import NotificationsModule au lieu de redéclarer ses providers
import { NotificationsModule } from '../notifications/notifications.module';

// Services & Controllers
import { EmailsController }       from './emails.controller';
import { EmailsService }          from './emails.service';
import { EmailProcessor }         from './email.processor';
import { EmailSchedulerService }  from './email-scheduler.service';

@Module({
  imports: [
    // SSE — événements temps réel
    EventEmitterModule.forRoot(),

    // Cron jobs (alertes stock, relances factures)
    ScheduleModule.forRoot(),

    // Bull Queue Redis pour envoi asynchrone avec retry
    BullModule.forRoot({
      redis: {
        host:  process.env.REDIS_HOST  ?? 'localhost',
        port:  parseInt(process.env.REDIS_PORT ?? '6379'),
      },
    }),
    BullModule.registerQueue({ name: 'emails' }),

    // Entités nécessaires aux services
    TypeOrmModule.forFeature([
      EmailLog,
      Invoice,
      Component,
      User,
      InventoryItem,
    ]),

    // FIX Bug #3 : NotificationsModule importé proprement
    NotificationsModule,
  ],
  controllers: [EmailsController],
  providers: [
    EmailsService,
    EmailProcessor,
    EmailSchedulerService,
  ],
  exports: [EmailsService, NotificationsModule],
})
export class EmailsModule {}
