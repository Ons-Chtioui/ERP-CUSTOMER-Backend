"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const documents_service_1 = require("./documents.service");
const documents_controller_1 = require("./documents.controller");
const quote_entity_1 = require("../commercial/quotes/entities/quote.entity");
const invoice_entity_1 = require("../commercial/invoices/entities/invoice.entity");
const delivery_note_entity_1 = require("../commercial/delivery-notes/entities/delivery-note.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const inventory_session_entity_1 = require("../inventory/entities/inventory-session.entity");
const product_inventory_entity_1 = require("../products/entities/product-inventory.entity");
let DocumentsModule = class DocumentsModule {
};
exports.DocumentsModule = DocumentsModule;
exports.DocumentsModule = DocumentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                quote_entity_1.Quote, invoice_entity_1.Invoice, delivery_note_entity_1.DeliveryNote, order_entity_1.Order, inventory_session_entity_1.InventorySession, product_inventory_entity_1.ProductInventory,
            ]),
        ],
        providers: [documents_service_1.DocumentsService],
        controllers: [documents_controller_1.DocumentsController],
        exports: [documents_service_1.DocumentsService],
    })
], DocumentsModule);
//# sourceMappingURL=documents.module.js.map