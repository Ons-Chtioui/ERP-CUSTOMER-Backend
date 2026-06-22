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
exports.DeliveryNoteLine = void 0;
const typeorm_1 = require("typeorm");
const delivery_note_entity_1 = require("./delivery-note.entity");
const product_entity_1 = require("../../../products/entities/product.entity");
let DeliveryNoteLine = class DeliveryNoteLine {
};
exports.DeliveryNoteLine = DeliveryNoteLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], DeliveryNoteLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_note_id', type: 'int' }),
    __metadata("design:type", Number)
], DeliveryNoteLine.prototype, "deliveryNoteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => delivery_note_entity_1.DeliveryNote, (dn) => dn.lines, {
        nullable: false,
        onDelete: 'CASCADE',
    }),
    (0, typeorm_1.JoinColumn)({ name: 'delivery_note_id' }),
    __metadata("design:type", delivery_note_entity_1.DeliveryNote)
], DeliveryNoteLine.prototype, "deliveryNote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'product_id', type: 'int' }),
    __metadata("design:type", Number)
], DeliveryNoteLine.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'product_id' }),
    __metadata("design:type", product_entity_1.Product)
], DeliveryNoteLine.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'quantity_ordered',
        type: 'numeric',
        precision: 10,
        scale: 3,
        default: 0,
        transformer: {
            to: (v) => v,
            from: (v) => parseFloat(v ?? '0'),
        },
    }),
    __metadata("design:type", Number)
], DeliveryNoteLine.prototype, "quantityOrdered", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'quantity_delivered',
        type: 'numeric',
        precision: 10,
        scale: 3,
        transformer: {
            to: (v) => v,
            from: (v) => parseFloat(v ?? '0'),
        },
    }),
    __metadata("design:type", Number)
], DeliveryNoteLine.prototype, "quantityDelivered", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], DeliveryNoteLine.prototype, "position", void 0);
exports.DeliveryNoteLine = DeliveryNoteLine = __decorate([
    (0, typeorm_1.Entity)('delivery_note_lines')
], DeliveryNoteLine);
//# sourceMappingURL=delivery-note-line.entity.js.map