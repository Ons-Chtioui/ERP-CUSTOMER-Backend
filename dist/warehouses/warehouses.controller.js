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
exports.WarehousesController = void 0;
const common_1 = require("@nestjs/common");
const warehouses_service_1 = require("./warehouses.service");
const create_warehouse_dto_1 = require("./dto/create-warehouse.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../common/decorators/require-permissions.decorator");
let WarehousesController = class WarehousesController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    findAll() { return this.svc.findAll(); }
    summary() { return this.svc.getGlobalSummary(); }
    findOne(id) { return this.svc.findOne(id); }
    getStock(id) { return this.svc.getStock(id); }
    create(dto) { return this.svc.create(dto); }
    update(id, dto) {
        return this.svc.update(id, dto);
    }
    toggle(id) { return this.svc.toggleActive(id); }
};
exports.WarehousesController = WarehousesController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stock'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "getStock", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_warehouse_dto_1.CreateWarehouseDto]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/toggle'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], WarehousesController.prototype, "toggle", null);
exports.WarehousesController = WarehousesController = __decorate([
    (0, common_1.Controller)('warehouses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [warehouses_service_1.WarehousesService])
], WarehousesController);
//# sourceMappingURL=warehouses.controller.js.map