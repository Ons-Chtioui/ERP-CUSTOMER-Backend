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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
const create_product_dto_1 = require("./dto/create-product.dto");
const set_bom_dto_1 = require("./dto/set-bom.dto");
const produce_dto_1 = require("./dto/produce.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../common/decorators/require-permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ProductsController = class ProductsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    findAll(search, categoryId, parentId) {
        return this.svc.findAll({
            search,
            categoryId: categoryId ? +categoryId : undefined,
            parentId: parentId ? +parentId : undefined,
        });
    }
    findOne(id) { return this.svc.findOne(id); }
    create(dto) { return this.svc.create(dto); }
    update(id, dto) { return this.svc.update(id, dto); }
    archive(id) { return this.svc.archive(id); }
    getBom(id) { return this.svc.getBom(id); }
    setBom(id, dto) { return this.svc.setBom(id, dto); }
    upsertBomLine(id, componentId, quantity) { return this.svc.upsertBomLine(id, componentId, quantity); }
    deleteBomLine(id, componentId) { return this.svc.deleteBomLine(id, componentId); }
    getAvailability(id, warehouseId) { return this.svc.getAvailability(id, warehouseId ? +warehouseId : undefined); }
    simulate(id, body) { return this.svc.simulate(id, body.quantity, body.warehouseId); }
    produce(id, dto, user) { return this.svc.produce(id, dto, user.id); }
    getLogs(id) { return this.svc.getProductionLogs(id); }
    getInventory(id) { return this.svc.getProductInventory(id); }
    transferStock(id, body, user) {
        return this.svc.transferProductStock(id, body.fromWarehouseId, body.toWarehouseId, body.quantity, user.id);
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.view'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('parentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.delete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "archive", null);
__decorate([
    (0, common_1.Get)(':id/bom'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getBom", null);
__decorate([
    (0, common_1.Put)(':id/bom'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, set_bom_dto_1.SetBomDto]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "setBom", null);
__decorate([
    (0, common_1.Patch)(':id/bom/:componentId'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('componentId', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)('quantity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "upsertBomLine", null);
__decorate([
    (0, common_1.Delete)(':id/bom/:componentId'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.edit'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Param)('componentId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "deleteBomLine", null);
__decorate([
    (0, common_1.Get)(':id/availability'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('warehouseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Post)(':id/simulate'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "simulate", null);
__decorate([
    (0, common_1.Post)(':id/produce'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.produce'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, produce_dto_1.ProduceDto, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "produce", null);
__decorate([
    (0, common_1.Get)(':id/production-logs'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getLogs", null);
__decorate([
    (0, common_1.Get)(':id/inventory'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "getInventory", null);
__decorate([
    (0, common_1.Post)(':id/inventory/transfer'),
    (0, require_permissions_decorator_1.RequirePermissions)('bom.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "transferStock", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map