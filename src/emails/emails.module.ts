// src/emails/emails.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { join } from 'path';

// Entités
import { EmailLog } from './entities/email-log.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Invoice } from '../commercial/invoices/entities/invoice.entity';
import { Component } from '../components/entities/component.entity';
import { User } from '../users/entities/user.entity';

// Services & Controllers
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailProcessor } from './email.processor';
import { EmailSchedulerService } from './email-scheduler.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsController } from '../notifications/notifications.controller';
import { InventoryItem } from 'src/components/entities/inventory-item.entity';

@Module({
  imports: [
    // Events pour SSE
    EventEmitterModule.forRoot(),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Mailer
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST') || 'smtp.gmail.com',
          port: configService.get('SMTP_PORT') || 587,
          secure: false,
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"${configService.get('MAIL_FROM_NAME')}" <${configService.get('MAIL_FROM') || configService.get('SMTP_USER')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),

    // Bull Queue (Redis)
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({ name: 'emails' }),

    // TypeORM
    TypeOrmModule.forFeature([
      EmailLog,
      Notification,
      Invoice,
      Component,
      User,
      InventoryItem,
    ]),
  ],
  controllers: [EmailsController, NotificationsController],
  providers: [
    EmailsService,
    EmailProcessor,
    EmailSchedulerService,
    NotificationsService,
  ],
  exports: [EmailsService, NotificationsService],
})
export class EmailsModule {}