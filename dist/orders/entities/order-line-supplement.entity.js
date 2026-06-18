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
exports.OrderLineSupplement = void 0;
const typeorm_1 = require("typeorm");
const order_line_entity_1 = require("./order-line.entity");
const component_entity_1 = require("../../components/entities/component.entity");
let OrderLineSupplement = class OrderLineSupplement {
};
exports.OrderLineSupplement = OrderLineSupplement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], OrderLineSupplement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_line_id', type: 'int' }),
    __metadata("design:type", Number)
], OrderLineSupplement.prototype, "orderLineId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_line_entity_1.OrderLine, (line) => line.supplements, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_line_id' }),
    __metadata("design:type", order_line_entity_1.OrderLine)
], OrderLineSupplement.prototype, "orderLine", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'component_id', type: 'int' }),
    __metadata("design:type", Number)
], OrderLineSupplement.prototype, "componentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => component_entity_1.Component, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'component_id' }),
    __metadata("design:type", component_entity_1.Component)
], OrderLineSupplement.prototype, "component", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 10, scale: 3 }),
    __metadata("design:type", Number)
], OrderLineSupplement.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_price', type: 'numeric', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], OrderLineSupplement.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tva_rate', type: 'numeric', precision: 5, scale: 2, default: 19 }),
    __metadata("design:type", Number)
], OrderLineSupplement.prototype, "tvaRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_ht', type: 'numeric', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], OrderLineSupplement.prototype, "totalHt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'qty_deducted', type: 'numeric', precision: 10, scale: 3, default: 0 }),
    __metadata("design:type", Number)
], OrderLineSupplement.prototype, "qtyDeducted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], OrderLineSupplement.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], OrderLineSupplement.prototype, "createdAt", void 0);
exports.OrderLineSupplement = OrderLineSupplement = __decorate([
    (0, typeorm_1.Entity)('order_line_supplements')
], OrderLineSupplement);
//# sourceMappingURL=order-line-supplement.entity.js.map