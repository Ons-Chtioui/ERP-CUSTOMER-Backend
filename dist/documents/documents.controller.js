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
exports.DocumentsController = void 0;
const common_1 = require("@nestjs/common");
const documents_service_1 = require("./documents.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const require_permission_decorator_1 = require("../common/decorators/require-permission.decorator");
let DocumentsController = class DocumentsController {
    service;
    constructor(service) {
        this.service = service;
    }
    streamPdf(res, buffer, filename) {
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`,
            'Content-Length': buffer.length,
        });
        res.end(buffer);
    }
    async quotePdf(id, res) {
        const { buffer, filename } = await this.service.generateQuotePdf(id);
        this.streamPdf(res, buffer, filename);
    }
    sendQuote(id) {
        return this.service.sendQuoteEmail(id);
    }
    async invoicePdf(id, res) {
        const { buffer, filename } = await this.service.generateInvoicePdf(id);
        this.streamPdf(res, buffer, filename);
    }
    sendInvoice(id) {
        return this.service.sendInvoiceEmail(id);
    }
    async deliveryPdf(id, res) {
        const { buffer, filename } = await this.service.generateDeliveryNotePdf(id);
        this.streamPdf(res, buffer, filename);
    }
    async orderPdf(id, res) {
        const { buffer, filename } = await this.service.generateOrderPdf(id);
        this.streamPdf(res, buffer, filename);
    }
    async inventoryPdf(id, res) {
        const { buffer, filename } = await this.service.generateInventoryPdf(id);
        this.streamPdf(res, buffer, filename);
    }
};
exports.DocumentsController = DocumentsController;
__decorate([
    (0, common_1.Get)('quotes/:id/pdf'),
    (0, require_permission_decorator_1.RequirePermission)('quotes.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "quotePdf", null);
__decorate([
    (0, common_1.Post)('quotes/:id/send'),
    (0, require_permission_decorator_1.RequirePermission)('quotes.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "sendQuote", null);
__decorate([
    (0, common_1.Get)('invoices/:id/pdf'),
    (0, require_permission_decorator_1.RequirePermission)('invoices.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "invoicePdf", null);
__decorate([
    (0, common_1.Post)('invoices/:id/send'),
    (0, require_permission_decorator_1.RequirePermission)('invoices.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DocumentsController.prototype, "sendInvoice", null);
__decorate([
    (0, common_1.Get)('delivery-notes/:id/pdf'),
    (0, require_permission_decorator_1.RequirePermission)('delivery.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "deliveryPdf", null);
__decorate([
    (0, common_1.Get)('orders/:id/pdf'),
    (0, require_permission_decorator_1.RequirePermission)('orders.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "orderPdf", null);
__decorate([
    (0, common_1.Get)('inventory/:id/pdf'),
    (0, require_permission_decorator_1.RequirePermission)('stock.inventory'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], DocumentsController.prototype, "inventoryPdf", null);
exports.DocumentsController = DocumentsController = __decorate([
    (0, common_1.Controller)('documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], DocumentsController);
//# sourceMappingURL=documents.controller.js.map