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
exports.Invoice = exports.InvoiceType = exports.InvoiceStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../../users/entities/user.entity");
const client_entity_1 = require("../../../clients/entities/client.entity");
const order_entity_1 = require("../../../orders/entities/order.entity");
const quote_entity_1 = require("../../quotes/entities/quote.entity");
const invoice_line_entity_1 = require("./invoice-line.entity");
const payment_entity_1 = require("./payment.entity");
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "draft";
    InvoiceStatus["SENT"] = "sent";
    InvoiceStatus["PARTIAL"] = "partial";
    InvoiceStatus["PAID"] = "paid";
    InvoiceStatus["OVERDUE"] = "overdue";
    InvoiceStatus["CANCELLED"] = "cancelled";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var InvoiceType;
(function (InvoiceType) {
    InvoiceType["INVOICE"] = "invoice";
    InvoiceType["CREDIT_NOTE"] = "credit_note";
})(InvoiceType || (exports.InvoiceType = InvoiceType = {}));
let Invoice = class Invoice {
};
exports.Invoice = Invoice;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Invoice.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Invoice.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', type: 'int' }),
    __metadata("design:type", Number)
], Invoice.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_entity_1.Client, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", client_entity_1.Client)
], Invoice.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quote_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "quoteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => quote_entity_1.Quote, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'quote_id' }),
    __metadata("design:type", Object)
], Invoice.prototype, "quote", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'order_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => order_entity_1.Order, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'order_id' }),
    __metadata("design:type", Object)
], Invoice.prototype, "order", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'original_invoice_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "originalInvoiceId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Invoice, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'original_invoice_id' }),
    __metadata("design:type", Object)
], Invoice.prototype, "originalInvoice", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: InvoiceType.INVOICE,
    }),
    __metadata("design:type", String)
], Invoice.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: InvoiceStatus.DRAFT,
    }),
    __metadata("design:type", String)
], Invoice.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'due_date', type: 'date', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "dueDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Invoice.prototype, "note", void 0);
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
], Invoice.prototype, "discount", void 0);
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
], Invoice.prototype, "totalHt", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'total_tva',
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
], Invoice.prototype, "totalTva", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'total_ttc',
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
], Invoice.prototype, "totalTtc", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'amount_paid',
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
], Invoice.prototype, "amountPaid", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'int' }),
    __metadata("design:type", Number)
], Invoice.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Invoice.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => invoice_line_entity_1.InvoiceLine, (line) => line.invoice, {
        cascade: ['insert', 'update', 'remove'],
        eager: false,
    }),
    __metadata("design:type", Array)
], Invoice.prototype, "lines", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_entity_1.Payment, (payment) => payment.invoice, {
        cascade: false,
        eager: false,
    }),
    __metadata("design:type", Array)
], Invoice.prototype, "payments", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Invoice.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Invoice.prototype, "updatedAt", void 0);
exports.Invoice = Invoice = __decorate([
    (0, typeorm_1.Entity)('invoices')
], Invoice);
//# sourceMappingURL=invoice.entity.js.map