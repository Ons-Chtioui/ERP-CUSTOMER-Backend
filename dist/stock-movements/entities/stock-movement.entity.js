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
exports.StockMovement = exports.MovementType = void 0;
const typeorm_1 = require("typeorm");
const warehouse_entity_1 = require("../../warehouses/entities/warehouse.entity");
const component_entity_1 = require("../../components/entities/component.entity");
const user_entity_1 = require("../../users/entities/user.entity");
var MovementType;
(function (MovementType) {
    MovementType["IN"] = "IN";
    MovementType["OUT"] = "OUT";
    MovementType["TRANSFER"] = "TRANSFER";
    MovementType["ADJUSTMENT"] = "ADJUSTMENT";
})(MovementType || (exports.MovementType = MovementType = {}));
let StockMovement = class StockMovement {
    id;
    warehouse;
    component;
    user;
    type;
    quantity;
    quantityBefore;
    quantityAfter;
    referenceDoc;
    notes;
    targetWarehouse;
    inventorySessionId;
    createdAt;
};
exports.StockMovement = StockMovement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], StockMovement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], StockMovement.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => component_entity_1.Component),
    (0, typeorm_1.JoinColumn)({ name: 'component_id' }),
    __metadata("design:type", component_entity_1.Component)
], StockMovement.prototype, "component", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], StockMovement.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MovementType }),
    __metadata("design:type", String)
], StockMovement.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 4 }),
    __metadata("design:type", Number)
], StockMovement.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_before', type: 'decimal', precision: 12, scale: 4 }),
    __metadata("design:type", Number)
], StockMovement.prototype, "quantityBefore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_after', type: 'decimal', precision: 12, scale: 4 }),
    __metadata("design:type", Number)
], StockMovement.prototype, "quantityAfter", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reference_doc', length: 100, nullable: true }),
    __metadata("design:type", String)
], StockMovement.prototype, "referenceDoc", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], StockMovement.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'target_warehouse_id' }),
    __metadata("design:type", Object)
], StockMovement.prototype, "targetWarehouse", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'inventory_session_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], StockMovement.prototype, "inventorySessionId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StockMovement.prototype, "createdAt", void 0);
exports.StockMovement = StockMovement = __decorate([
    (0, typeorm_1.Entity)('stock_movements')
], StockMovement);
//# sourceMappingURL=stock-movement.entity.js.map