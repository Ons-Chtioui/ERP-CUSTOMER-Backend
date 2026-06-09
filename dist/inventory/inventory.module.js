"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const inventory_session_entity_1 = require("./entities/inventory-session.entity");
const inventory_line_entity_1 = require("./entities/inventory-line.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
const component_entity_1 = require("../components/entities/component.entity");
const stock_movement_entity_1 = require("../stock-movements/entities/stock-movement.entity");
const inventory_controller_1 = require("./inventory.controller");
const inventory_service_1 = require("./inventory.service");
let InventoryModule = class InventoryModule {
};
exports.InventoryModule = InventoryModule;
exports.InventoryModule = InventoryModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([
                inventory_session_entity_1.InventorySession, inventory_line_entity_1.InventoryLine, inventory_item_entity_1.InventoryItem, component_entity_1.Component, stock_movement_entity_1.StockMovement,
            ])],
        controllers: [inventory_controller_1.InventoryController],
        providers: [inventory_service_1.InventoryService],
        exports: [inventory_service_1.InventoryService],
    })
], InventoryModule);
//# sourceMappingURL=inventory.module.js.map