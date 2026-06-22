"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const roles_module_1 = require("./roles/roles.module");
const permissions_module_1 = require("./permissions/permissions.module");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const throttler_1 = require("@nestjs/throttler");
const mailer_1 = require("@nestjs-modules/mailer");
const schedule_1 = require("@nestjs/schedule");
const path_1 = require("path");
const warehouses_module_1 = require("./warehouses/warehouses.module");
const components_module_1 = require("./components/components.module");
const stock_movements_module_1 = require("./stock-movements/stock-movements.module");
const inventory_module_1 = require("./inventory/inventory.module");
const stock_alerts_module_1 = require("./stock-alerts/stock-alerts.module");
const products_module_1 = require("./products/products.module");
const product_categories_module_1 = require("./product-categories/product-categories.module");
const orders_module_1 = require("./orders/orders.module");
const clients_module_1 = require("./clients/clients.module");
const quotes_module_1 = require("./commercial/quotes/quotes.module");
const invoices_module_1 = require("./commercial/invoices/invoices.module");
const delivery_notes_module_1 = require("./commercial/delivery-notes/delivery-notes.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'postgres',
                    host: configService.get('DB_HOST'),
                    port: configService.get('DB_PORT'),
                    username: configService.get('DB_USERNAME'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_DATABASE'),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: configService.get('NODE_ENV') !== 'production',
                    logging: configService.get('NODE_ENV') === 'development',
                }),
            }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([
                { name: 'short', ttl: 60000, limit: 20 },
            ]),
            mailer_1.MailerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    transport: {
                        host: configService.get('MAIL_HOST'),
                        port: configService.get('MAIL_PORT'),
                        auth: {
                            user: configService.get('MAIL_USER'),
                            pass: configService.get('MAIL_PASS'),
                        },
                    },
                    defaults: { from: configService.get('MAIL_FROM') },
                    template: {
                        dir: (0, path_1.join)(__dirname, 'templates'),
                    },
                }),
            }),
            auth_module_1.AuthModule, users_module_1.UsersModule, roles_module_1.RolesModule, permissions_module_1.PermissionsModule, warehouses_module_1.WarehousesModule, components_module_1.ComponentsModule, stock_movements_module_1.StockMovementsModule, inventory_module_1.InventoryModule, stock_alerts_module_1.StockAlertsModule, products_module_1.ProductsModule, product_categories_module_1.ProductCategoriesModule, orders_module_1.OrdersModule, clients_module_1.ClientsModule, quotes_module_1.QuotesModule, invoices_module_1.InvoicesModule, delivery_notes_module_1.DeliveryNotesModule
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map