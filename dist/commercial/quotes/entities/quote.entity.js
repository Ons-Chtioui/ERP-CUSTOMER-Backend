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
exports.Quote = exports.QuoteStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../../users/entities/user.entity");
const client_entity_1 = require("../../../clients/entities/client.entity");
const invoice_entity_1 = require("../../invoices/entities/invoice.entity");
const quote_line_entity_1 = require("./quote-line.entity");
var QuoteStatus;
(function (QuoteStatus) {
    QuoteStatus["DRAFT"] = "draft";
    QuoteStatus["SENT"] = "sent";
    QuoteStatus["ACCEPTED"] = "accepted";
    QuoteStatus["REFUSED"] = "refused";
    QuoteStatus["EXPIRED"] = "expired";
    QuoteStatus["CONVERTED"] = "converted";
})(QuoteStatus || (exports.QuoteStatus = QuoteStatus = {}));
let Quote = class Quote {
};
exports.Quote = Quote;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Quote.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, unique: true }),
    __metadata("design:type", String)
], Quote.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'client_id', type: 'int' }),
    __metadata("design:type", Number)
], Quote.prototype, "clientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => client_entity_1.Client, { nullable: false, onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'client_id' }),
    __metadata("design:type", client_entity_1.Client)
], Quote.prototype, "client", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        length: 20,
        default: QuoteStatus.DRAFT,
    }),
    __metadata("design:type", String)
], Quote.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'valid_until', type: 'date' }),
    __metadata("design:type", String)
], Quote.prototype, "validUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "note", void 0);
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
], Quote.prototype, "discount", void 0);
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
], Quote.prototype, "totalHt", void 0);
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
], Quote.prototype, "totalTva", void 0);
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
], Quote.prototype, "totalTtc", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'converted_to', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "convertedTo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => invoice_entity_1.Invoice, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'converted_to' }),
    __metadata("design:type", Object)
], Quote.prototype, "convertedInvoice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'converted_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], Quote.prototype, "convertedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'created_by', type: 'int' }),
    __metadata("design:type", Number)
], Quote.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'created_by' }),
    __metadata("design:type", user_entity_1.User)
], Quote.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => quote_line_entity_1.QuoteLine, (line) => line.quote, {
        cascade: ['insert', 'update', 'remove'],
        eager: false,
    }),
    __metadata("design:type", Array)
], Quote.prototype, "lines", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Quote.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Quote.prototype, "updatedAt", void 0);
exports.Quote = Quote = __decorate([
    (0, typeorm_1.Entity)('quotes')
], Quote);
//# sourceMappingURL=quote.entity.js.map