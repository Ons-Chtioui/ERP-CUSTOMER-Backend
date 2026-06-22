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
exports.QuoteLine = void 0;
const typeorm_1 = require("typeorm");
const quote_entity_1 = require("./quote.entity");
const product_entity_1 = require("../../../products/entities/product.entity");
let QuoteLine = class QuoteLine {
};
exports.QuoteLine = QuoteLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], QuoteLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quote_id', type: 'int' }),
    __metadata("design:type", Number)
], QuoteLine.prototype, "quoteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quote_entity_1.Quote, (quote) => quote.lines, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'quote_id' }),
    __metadata("design:type", quote_entity_1.Quote)
], QuoteLine.prototype, "quote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'int' }),
    __metadata("design:type", Number)
], QuoteLine.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], QuoteLine.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], QuoteLine.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'numeric',
        precision: 10,
        scale: 3,
        transformer: {
            to: (v) => v,
            from: (v) => parseFloat(v ?? '0'),
        },
    }),
    __metadata("design:type", Number)
], QuoteLine.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'unit_price',
        type: 'numeric',
        precision: 12,
        scale: 3,
        transformer: {
            to: (v) => v,
            from: (v) => parseFloat(v ?? '0'),
        },
    }),
    __metadata("design:type", Number)
], QuoteLine.prototype, "unitPrice", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'tva_rate',
        type: 'numeric',
        precision: 5,
        scale: 2,
        default: 19,
        transformer: {
            to: (v) => v,
            from: (v) => parseFloat(v ?? '19'),
        },
    }),
    __metadata("design:type", Number)
], QuoteLine.prototype, "tvaRate", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'numeric',
        precision: 5,
        scale: 2,
        default: 0,
        transformer: {
            to: (v) => v,
            from: (v) => parseFloat(v ?? '0'),
        },
    }),
    __metadata("design:type", Number)
], QuoteLine.prototype, "discount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'total_ht',
        type: 'numeric',
        precision: 12,
        scale: 3,
        default: 0,
        transformer: {
            to: (v) => v,
            from: (v) => parseFloat(v ?? '0'),
        },
    }),
    __metadata("design:type", Number)
], QuoteLine.prototype, "totalHt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], QuoteLine.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], QuoteLine.prototype, "createdAt", void 0);
exports.QuoteLine = QuoteLine = __decorate([
    (0, typeorm_1.Entity)('quote_lines')
], QuoteLine);
//# sourceMappingURL=quote-line.entity.js.map