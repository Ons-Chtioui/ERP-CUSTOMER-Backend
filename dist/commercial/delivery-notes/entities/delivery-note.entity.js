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
exports.DeliveryNote = exports.DeliveryStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../../users/entities/user.entity");
const client_entity_1 = require("../../../clients/entities/client.entity");
const order_entity_1 = require("../../../orders/entities/order.entity");
const invoice_entity_1 = require("../../invoices/entities/invoice.entity");
const delivery_note_line_entity_1 = require("./delivery-note-line.entity");
var DeliveryStatus;
(function (DeliveryStatus) {
    DeliveryStatus["PENDING"] = "pending";
    DeliveryStatus["DELIVERED"] = "delivered";
    DeliveryStatus["SIGNED"] = "signed";
})(DeliveryStatus || (exports.DeliveryStatus = DeliveryStatus = {}));
let DeliveryNote = class DeliveryNote {
};
exports.DeliveryNote = DeliveryNote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], DeliveryNote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], DeliveryNote.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', type: 'int' }),
    __metadata("design:type", Number)
], DeliveryNote.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_entity_1.Client, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", client_entity_1.Client)
], DeliveryNote.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], DeliveryNote.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", Object)
], DeliveryNote.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'invoice_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], DeliveryNote.prototype, "invoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => invoice_entity_1.Invoice, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'invoice_id' }),
    __metadata("design:type", Object)
], DeliveryNote.prototype, "invoice", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: DeliveryStatus.PENDING,
    }),
    __metadata("design:type", String)
], DeliveryNote.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivery_address', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], DeliveryNote.prototype, "deliveryAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'delivered_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], DeliveryNote.prototype, "deliveredAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'signature_url', type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", Object)
], DeliveryNote.prototype, "signatureUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], DeliveryNote.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'int' }),
    __metadata("design:type", Number)
], DeliveryNote.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], DeliveryNote.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => delivery_note_line_entity_1.DeliveryNoteLine, (line) => line.deliveryNote, {
        cascade: ['insert', 'update', 'remove'],
        eager: false,
    }),
    __metadata("design:type", Array)
], DeliveryNote.prototype, "lines", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], DeliveryNote.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], DeliveryNote.prototype, "updatedAt", void 0);
exports.DeliveryNote = DeliveryNote = __decorate([
    (0, typeorm_1.Entity)('delivery_notes')
], DeliveryNote);
//# sourceMappingURL=delivery-note.entity.js.map