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
exports.StockMovementsController = void 0;
const common_1 = require("@nestjs/common");
const stock_movements_service_1 = require("./stock-movements.service");
const create_movement_dto_1 = require("./dto/create-movement.dto");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const require_permissions_decorator_1 = require("../common/decorators/require-permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let StockMovementsController = class StockMovementsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    findHistory(wId, cId, type, limit) {
        return this.svc.findHistory({
            warehouseId: wId ? +wId : undefined,
            componentId: cId ? +cId : undefined,
            type,
            limit: limit ? +limit : 100,
        });
    }
    createIn(dto, u) {
        return this.svc.createIn(dto, u.id);
    }
    createOut(dto, u) {
        return this.svc.createOut(dto, u.id);
    }
    createTransfer(dto, u) {
        return this.svc.createTransfer(dto, u.id);
    }
};
exports.StockMovementsController = StockMovementsController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.view'),
    __param(0, (0, common_1.Query)('warehouseId')),
    __param(1, (0, common_1.Query)('componentId')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "findHistory", null);
__decorate([
    (0, common_1.Post)('in'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_movement_dto_1.CreateMovementDto, Object]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "createIn", null);
__decorate([
    (0, common_1.Post)('out'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_movement_dto_1.CreateMovementDto, Object]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "createOut", null);
__decorate([
    (0, common_1.Post)('transfer'),
    (0, require_permissions_decorator_1.RequirePermissions)('stock.transfer'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_movement_dto_1.CreateTransferDto, Object]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "createTransfer", null);
exports.StockMovementsController = StockMovementsController = __decorate([
    (0, common_1.Controller)('stock-movements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    __metadata("design:paramtypes", [stock_movements_service_1.StockMovementsService])
], StockMovementsController);
//# sourceMappingURL=stock-movements.controller.js.map