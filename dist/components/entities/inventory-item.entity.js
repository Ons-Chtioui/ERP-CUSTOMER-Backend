"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryItem = void 0;
const typeorm_1 = require("typeorm");
const warehouse_entity_1 = require("../../warehouses/entities/warehouse.entity");
const component_entity_1 = require("./component.entity");
let InventoryItem = class InventoryItem {
    id;
    warehouse;
    component;
    quantity;
    reservedQty;
    updatedAt;
};
exports.InventoryItem = InventoryItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], InventoryItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, (w) => w.inventoryItems),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], InventoryItem.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => component_entity_1.Component, (c) => c.inventoryItems),
    (0, typeorm_1.JoinColumn)({ name: 'component_id' }),
    __metadata("design:type", component_entity_1.Component)
], InventoryItem.prototype, "component", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reserved_qty', type: 'decimal', precision: 12, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], InventoryItem.prototype, "reservedQty", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], InventoryItem.prototype, "updatedAt", void 0);
exports.InventoryItem = InventoryItem = __decorate([
    (0, typeorm_1.Entity)('inventory_items'),
    (0, typeorm_1.Unique)(['warehouse', 'component'])
], InventoryItem);
//# sourceMappingURL=inventory-item.entity.js.map