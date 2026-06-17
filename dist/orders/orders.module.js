"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const order_entity_1 = require("./entities/order.entity");
const order_line_entity_1 = require("./entities/order-line.entity");
const order_status_history_entity_1 = require("./entities/order-status-history.entity");
const product_entity_1 = require("../products/entities/product.entity");
const bom_line_entity_1 = require("../products/entities/bom-line.entity");
const product_inventory_entity_1 = require("../products/entities/product-inventory.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
const warehouse_entity_1 = require("../warehouses/entities/warehouse.entity");
const products_module_1 = require("../products/products.module");
const orders_service_1 = require("./orders.service");
const orders_controller_1 = require("./orders.controller");
let OrdersModule = class OrdersModule {
};
exports.OrdersModule = OrdersModule;
exports.OrdersModule = OrdersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                order_entity_1.Order, order_line_entity_1.OrderLine, order_status_history_entity_1.OrderStatusHistory,
                product_entity_1.Product, bom_line_entity_1.BomLine, product_inventory_entity_1.ProductInventory, inventory_item_entity_1.InventoryItem, warehouse_entity_1.Warehouse,
            ]),
            products_module_1.ProductsModule,
        ],
        controllers: [orders_controller_1.OrdersController],
        providers: [orders_service_1.OrdersService],
        exports: [orders_service_1.OrdersService, typeorm_1.TypeOrmModule],
    })
], OrdersModule);
//# sourceMappingURL=orders.module.js.map