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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const create_order_dto_1 = require("./dto/create-order.dto");
const update_order_status_dto_1 = require("./dto/update-order-status.dto");
const query_orders_dto_1 = require("./dto/query-orders.dto");
const update_order_lines_dto_1 = require("./dto/update-order-lines.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const require_permission_decorator_1 = require("../common/decorators/require-permission.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let OrdersController = class OrdersController {
    service;
    constructor(service) {
        this.service = service;
    }
    create(dto, user) {
        return this.service.create(dto, user.id);
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    getStats() {
        return this.service.getStats();
    }
    previewLineFulfillment(productId, quantity) {
        return this.service.previewLineFulfillment(productId, quantity);
    }
    findOne(id) {
        return this.service.findOne(id);
    }
    updateStatus(id, dto, user) {
        return this.service.updateStatus(id, dto, user.id);
    }
    updateLines(id, dto, user) {
        return this.service.updateLines(id, dto, user.id);
    }
    checkAvailability(id) {
        return this.service.checkAvailability(id);
    }
    remove(id) {
        return this.service.remove(id);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permission_decorator_1.RequirePermission)('orders.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_order_dto_1.CreateOrderDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('orders.view'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_orders_dto_1.QueryOrdersDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, require_permission_decorator_1.RequirePermission)('orders.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('fulfillment-preview'),
    (0, require_permission_decorator_1.RequirePermission)('orders.view'),
    __param(0, (0, common_1.Query)('productId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('quantity', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "previewLineFulfillment", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('orders.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, require_permission_decorator_1.RequirePermission)('orders.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_order_status_dto_1.UpdateOrderStatusDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(':id/lines'),
    (0, require_permission_decorator_1.RequirePermission)('orders.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, update_order_lines_dto_1.UpdateOrderLinesDto, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateLines", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    (0, require_permission_decorator_1.RequirePermission)('orders.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "checkAvailability", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('orders.delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "remove", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map