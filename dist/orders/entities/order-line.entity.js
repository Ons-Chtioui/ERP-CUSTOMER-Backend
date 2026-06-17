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
exports.OrderLine = void 0;
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./order.entity");
const product_entity_1 = require("../../products/entities/product.entity");
let OrderLine = class OrderLine {
};
exports.OrderLine = OrderLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], OrderLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id', type: 'int' }),
    __metadata("design:type", Number)
], OrderLine.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, (order) => order.lines, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", order_entity_1.Order)
], OrderLine.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'int' }),
    __metadata("design:type", Number)
], OrderLine.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], OrderLine.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], OrderLine.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'qty_from_stock', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], OrderLine.prototype, "qtyFromStock", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'qty_from_assembly', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], OrderLine.prototype, "qtyFromAssembly", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'unit_price', type: 'numeric', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], OrderLine.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'tva_rate', type: 'numeric', precision: 5, scale: 2, default: 19 }),
    __metadata("design:type", Number)
], OrderLine.prototype, "tvaRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], OrderLine.prototype, "discount", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_ht', type: 'numeric', precision: 12, scale: 3 }),
    __metadata("design:type", Number)
], OrderLine.prototype, "totalHt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], OrderLine.prototype, "createdAt", void 0);
exports.OrderLine = OrderLine = __decorate([
    (0, typeorm_1.Entity)('order_lines')
], OrderLine);
//# sourceMappingURL=order-line.entity.js.map