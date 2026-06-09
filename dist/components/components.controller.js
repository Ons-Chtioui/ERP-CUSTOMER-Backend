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
exports.ComponentsController = void 0;
const common_1 = require("@nestjs/common");
const components_service_1 = require("./components.service");
const create_component_dto_1 = require("./dto/create-component.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../common/decorators/require-permissions.decorator");
let ComponentsController = class ComponentsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    findAll(search, categoryId, supplierId) {
        return this.svc.findAll({
            search,
            categoryId: categoryId ? +categoryId : undefined,
            supplierId: supplierId ? +supplierId : undefined,
        });
    }
    categories() { return this.svc.findAllCategories(); }
    suppliers() { return this.svc.findAllSuppliers(); }
    findOne(id) { return this.svc.findOne(id); }
    stock(id) { return this.svc.getStockSummary(id); }
    create(dto) { return this.svc.create(dto); }
    update(id, dto) {
        return this.svc.update(id, dto);
    }
    remove(id) { return this.svc.deactivate(id); }
    createCategory(b) {
        return this.svc.createCategory(b.nom, b.description);
    }
    createSupplier(b) { return this.svc.createSupplier(b); }
};
exports.ComponentsController = ComponentsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('supplierId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "categories", null);
__decorate([
    (0, common_1.Get)('suppliers'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "suppliers", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stock'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "stock", null);
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_component_dto_1.CreateComponentDto]),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.delete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('categories'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Post)('suppliers'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ComponentsController.prototype, "createSupplier", null);
exports.ComponentsController = ComponentsController = __decorate([
    (0, common_1.Controller)('components'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [components_service_1.ComponentsService])
], ComponentsController);
//# sourceMappingURL=components.controller.js.map