"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const dashboard_service_1 = require("./dashboard.service");
const dashboard_controller_1 = require("./dashboard.controller");
const order_entity_1 = require("../orders/entities/order.entity");
const order_line_entity_1 = require("../orders/entities/order-line.entity");
const invoice_entity_1 = require("../commercial/invoices/entities/invoice.entity");
const invoice_line_entity_1 = require("../commercial/invoices/entities/invoice-line.entity");
const quote_entity_1 = require("../commercial/quotes/entities/quote.entity");
const stock_alert_entity_1 = require("../stock-alerts/entities/stock-alert.entity");
const warehouse_entity_1 = require("../warehouses/entities/warehouse.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
let DashboardModule = class DashboardModule {
};
exports.DashboardModule = DashboardModule;
exports.DashboardModule = DashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                order_entity_1.Order, order_line_entity_1.OrderLine, invoice_entity_1.Invoice, invoice_line_entity_1.InvoiceLine, quote_entity_1.Quote,
                stock_alert_entity_1.StockAlert, warehouse_entity_1.Warehouse, inventory_item_entity_1.InventoryItem,
            ]),
        ],
        providers: [dashboard_service_1.DashboardService],
        controllers: [dashboard_controller_1.DashboardController],
        exports: [dashboard_service_1.DashboardService],
    })
], DashboardModule);
//# sourceMappingURL=dashboard.module.js.map