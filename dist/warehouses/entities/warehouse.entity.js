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
exports.Warehouse = void 0;
const typeorm_1 = require("typeorm");
const inventory_item_entity_1 = require("../../components/entities/inventory-item.entity");
const stock_movement_entity_1 = require("../../stock-movements/entities/stock-movement.entity");
const inventory_session_entity_1 = require("../../inventory/entities/inventory-session.entity");
const stock_alert_entity_1 = require("../../stock-alerts/entities/stock-alert.entity");
let Warehouse = class Warehouse {
    id;
    companyId;
    nom;
    adresse;
    code;
    ville;
    pays;
    isActive;
    inventoryItems;
    stockMovements;
    inventorySessions;
    stockAlerts;
    createdAt;
    updatedAt;
};
exports.Warehouse = Warehouse;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Warehouse.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_id', nullable: true }),
    __metadata("design:type", Number)
], Warehouse.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Warehouse.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Warehouse.prototype, "adresse", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Warehouse.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Warehouse.prototype, "ville", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, default: 'France' }),
    __metadata("design:type", String)
], Warehouse.prototype, "pays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Warehouse.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_item_entity_1.InventoryItem, (item) => item.warehouse),
    __metadata("design:type", Array)
], Warehouse.prototype, "inventoryItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => stock_movement_entity_1.StockMovement, (movement) => movement.warehouse),
    __metadata("design:type", Array)
], Warehouse.prototype, "stockMovements", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_session_entity_1.InventorySession, (session) => session.warehouse),
    __metadata("design:type", Array)
], Warehouse.prototype, "inventorySessions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => stock_alert_entity_1.StockAlert, (alert) => alert.warehouse),
    __metadata("design:type", Array)
], Warehouse.prototype, "stockAlerts", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Warehouse.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Warehouse.prototype, "updatedAt", void 0);
exports.Warehouse = Warehouse = __decorate([
    (0, typeorm_1.Entity)('warehouses')
], Warehouse);
//# sourceMappingURL=warehouse.entity.js.map