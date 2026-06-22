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
exports.DeliveryNotesController = void 0;
const common_1 = require("@nestjs/common");
const delivery_notes_service_1 = require("./delivery-notes.service");
const create_delivery_note_dto_1 = require("./dto/create-delivery-note.dto");
const deliver_dto_1 = require("./dto/deliver.dto");
const delivery_note_entity_1 = require("./entities/delivery-note.entity");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const require_permission_decorator_1 = require("../../common/decorators/require-permission.decorator");
let DeliveryNotesController = class DeliveryNotesController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto, req) {
        return this.service.create(dto, req.user.id);
    }
    findAll(clientId, status) {
        return this.service.findAll({
            clientId: clientId ? Number(clientId) : undefined,
            status,
        });
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    markDelivered(id, dto) {
        return this.service.markDelivered(id, dto);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.DeliveryNotesController = DeliveryNotesController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('delivery.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_delivery_note_dto_1.CreateDeliveryNoteDto, Object]),
    __metadata("design:returntype", void 0)
], DeliveryNotesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('delivery.view'),
    __param(0, (0, common_1.Query)('clientId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], DeliveryNotesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('delivery.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DeliveryNotesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/deliver'),
    (0, require_permission_decorator_1.RequirePermission)('delivery.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, deliver_dto_1.DeliverDto]),
    __metadata("design:returntype", void 0)
], DeliveryNotesController.prototype, "markDelivered", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('delivery.delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], DeliveryNotesController.prototype, "remove", null);
exports.DeliveryNotesController = DeliveryNotesController = __decorate([
    (0, common_1.Controller)('delivery-notes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [delivery_notes_service_1.DeliveryNotesService])
], DeliveryNotesController);
//# sourceMappingURL=delivery-notes.controller.js.map