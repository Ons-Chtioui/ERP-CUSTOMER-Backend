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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoicesController = void 0;
const common_1 = require("@nestjs/common");
const invoices_service_1 = require("./invoices.service");
const create_invoice_dto_1 = require("./dto/create-invoice.dto");
const add_payment_dto_1 = require("./dto/add-payment.dto");
const query_invoices_dto_1 = require("./dto/query-invoices.dto");
const create_credit_note_dto_1 = require("./dto/create-credit-note.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permission_decorator_1 = require("../../common/decorators/require-permission.decorator");
let InvoicesController = class InvoicesController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        return this.service.create(dto, req.user.id);
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    getStats() {
        return this.service.getStats();
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    markSent(id) {
        return this.service.markSent(id);
    }
    addPayment(id, dto, req) {
        return this.service.addPayment(id, dto, req.user.id);
    }
    createCreditNote(id, dto, req) {
        return this.service.createCreditNote(id, req.user.id, dto.reason);
    }
    cancel(id) {
        return this.service.cancel(id);
    }
};
exports.InvoicesController = InvoicesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('invoices.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_invoice_dto_1.CreateInvoiceDto, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('invoices.view'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_invoices_dto_1.QueryInvoicesDto]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, require_permission_decorator_1.RequirePermission)('invoices.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('invoices.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/send'),
    (0, require_permission_decorator_1.RequirePermission)('invoices.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "markSent", null);
__decorate([
    (0, common_1.Post)(':id/payments'),
    (0, require_permission_decorator_1.RequirePermission)('invoices.pay'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, add_payment_dto_1.AddPaymentDto, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "addPayment", null);
__decorate([
    (0, common_1.Post)(':id/credit-note'),
    (0, require_permission_decorator_1.RequirePermission)('credits.create'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, create_credit_note_dto_1.CreateCreditNoteDto, Object]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "createCreditNote", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    (0, require_permission_decorator_1.RequirePermission)('invoices.cancel'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], InvoicesController.prototype, "cancel", null);
exports.InvoicesController = InvoicesController = __decorate([
    (0, common_1.Controller)('invoices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [invoices_service_1.InvoicesService])
], InvoicesController);
//# sourceMappingURL=invoices.controller.js.map