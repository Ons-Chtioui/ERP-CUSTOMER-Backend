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
exports.InventoryLine = void 0;
const typeorm_1 = require("typeorm");
const inventory_session_entity_1 = require("./inventory-session.entity");
const component_entity_1 = require("../../components/entities/component.entity");
let InventoryLine = class InventoryLine {
    id;
    session;
    component;
    quantityTheoretical;
    quantityCounted;
    ecart;
    notes;
    countedAt;
};
exports.InventoryLine = InventoryLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], InventoryLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => inventory_session_entity_1.InventorySession, (s) => s.lines),
    (0, typeorm_1.JoinColumn)({ name: 'session_id' }),
    __metadata("design:type", inventory_session_entity_1.InventorySession)
], InventoryLine.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => component_entity_1.Component),
    (0, typeorm_1.JoinColumn)({ name: 'component_id' }),
    __metadata("design:type", component_entity_1.Component)
], InventoryLine.prototype, "component", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_theoretical', type: 'decimal', precision: 12, scale: 4 }),
    __metadata("design:type", Number)
], InventoryLine.prototype, "quantityTheoretical", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_counted', type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], InventoryLine.prototype, "quantityCounted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 4, nullable: true }),
    __metadata("design:type", Object)
], InventoryLine.prototype, "ecart", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventoryLine.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'counted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventoryLine.prototype, "countedAt", void 0);
exports.InventoryLine = InventoryLine = __decorate([
    (0, typeorm_1.Entity)('inventory_lines')
], InventoryLine);
//# sourceMappingURL=inventory-line.entity.js.map