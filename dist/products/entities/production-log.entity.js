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
exports.ProductionLog = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("./product.entity");
const warehouse_entity_1 = require("../../warehouses/entities/warehouse.entity");
const user_entity_1 = require("../../users/entities/user.entity");
let ProductionLog = class ProductionLog {
    id;
    product;
    warehouse;
    user;
    quantity;
    coutUnitaireSnapshot;
    coutTotal;
    notes;
    producedAt;
};
exports.ProductionLog = ProductionLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], ProductionLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, (p) => p.productionLogs),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], ProductionLog.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], ProductionLog.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], ProductionLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 4 }),
    __metadata("design:type", Number)
], ProductionLog.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cout_unitaire_snapshot', type: 'decimal', precision: 12, scale: 4 }),
    __metadata("design:type", Number)
], ProductionLog.prototype, "coutUnitaireSnapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cout_total', type: 'decimal', precision: 12, scale: 4 }),
    __metadata("design:type", Number)
], ProductionLog.prototype, "coutTotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ProductionLog.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'produced_at' }),
    __metadata("design:type", Date)
], ProductionLog.prototype, "producedAt", void 0);
exports.ProductionLog = ProductionLog = __decorate([
    (0, typeorm_1.Entity)('production_logs')
], ProductionLog);
//# sourceMappingURL=production-log.entity.js.map