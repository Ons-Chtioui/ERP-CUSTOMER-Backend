import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { MailerModule } from '@nestjs-modules/mailer';

import { join } from 'path';
import { WarehousesModule } from './warehouses/warehouses.module';
import { ComponentsModule } from './components/components.module';
import { StockMovementsModule } from './stock-movements/stock-movements.module';
import { InventoryModule } from './inventory/inventory.module';
import { StockAlertsModule } from './stock-alerts/stock-alerts.module';
import { ProductsModule } from './products/products.module';
import { ProductCategoriesModule } from './product-categories/product-categories.module';
import { OrdersModule } from './orders/orders.module';
import { ClientsModule } from './clients/clients.module';

import { QuotesModule } from './commercial/quotes/quotes.module';
import { InvoicesModule } from './commercial/invoices/invoices.module';
import { DeliveryNotesModule } from './commercial/delivery-notes/delivery-notes.module';
import { DocumentsModule } from './documents/documents.module';

import { AnalyticsModule } from './analytics/analytics.module';
import { EmailsModule } from './emails/emails.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ name: 'short', ttl: 60000, limit: 20 }]),

    // ── Mailer global — accessible dans tous les modules ──────────
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        transport: {
          host:   cfg.get('SMTP_HOST')   ?? cfg.get('MAIL_HOST')   ?? 'smtp.gmail.com',
          port:   Number(cfg.get('SMTP_PORT')  ?? cfg.get('MAIL_PORT')  ?? 587),
          secure: false,
          auth: {
            user: cfg.get('SMTP_USER') ?? cfg.get('MAIL_USER'),
            pass: cfg.get('SMTP_PASS') ?? cfg.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: `"${cfg.get('MAIL_FROM_NAME') ?? 'ERP'}" <${cfg.get('SMTP_USER') ?? cfg.get('MAIL_FROM')}>`,
        },
        template: {
          dir:  join(__dirname, 'emails', 'templates'),
          // Pas d'adapter Handlebars — on envoie du HTML brut dans les templates
        },
      }),
    }),

    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    WarehousesModule,
    ComponentsModule,
    StockMovementsModule,
    InventoryModule,
    StockAlertsModule,
    ProductsModule,
    ProductCategoriesModule,
    OrdersModule,
    ClientsModule,
    QuotesModule,
    InvoicesModule,
    DeliveryNotesModule,
    DocumentsModule,
    AnalyticsModule,
    EmailsModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
