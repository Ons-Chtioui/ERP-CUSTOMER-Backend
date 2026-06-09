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
exports.StockAlertsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_alert_entity_1 = require("./entities/stock-alert.entity");
const component_entity_1 = require("../components/entities/component.entity");
let StockAlertsService = class StockAlertsService {
    alertsRepo;
    componentsRepo;
    constructor(alertsRepo, componentsRepo) {
        this.alertsRepo = alertsRepo;
        this.componentsRepo = componentsRepo;
    }
    async checkAndCreate(manager, warehouseId, componentId, currentQty) {
        const comp = await this.componentsRepo.findOne({ where: { id: componentId } });
        if (!comp || comp.seuilAlerte <= 0)
            return;
        if (currentQty <= comp.seuilAlerte) {
            const existing = await manager.findOne(stock_alert_entity_1.StockAlert, {
                where: { warehouse: { id: warehouseId }, component: { id: componentId }, status: stock_alert_entity_1.AlertStatus.ACTIVE },
            });
            if (!existing) {
                await manager.save(stock_alert_entity_1.StockAlert, manager.create(stock_alert_entity_1.StockAlert, {
                    warehouse: { id: warehouseId },
                    component: { id: componentId },
                    quantityAtAlert: currentQty,
                    threshold: comp.seuilAlerte,
                    status: stock_alert_entity_1.AlertStatus.ACTIVE,
                }));
            }
        }
    }
    async checkAndResolve(manager, warehouseId, componentId, currentQty) {
        const comp = await this.componentsRepo.findOne({ where: { id: componentId } });
        if (!comp)
            return;
        if (currentQty > comp.seuilAlerte) {
            await manager
                .createQueryBuilder()
                .update(stock_alert_entity_1.StockAlert)
                .set({ status: stock_alert_entity_1.AlertStatus.RESOLVED, resolvedAt: new Date() })
                .where('warehouse_id = :wId', { wId: warehouseId })
                .andWhere('component_id = :cId', { cId: componentId })
                .andWhere('status = :status', { status: stock_alert_entity_1.AlertStatus.ACTIVE })
                .execute();
        }
    }
    async findActive(warehouseId) {
        const qb = this.alertsRepo
            .createQueryBuilder('a')
            .leftJoinAndSelect('a.warehouse', 'warehouse')
            .leftJoinAndSelect('a.component', 'component')
            .leftJoinAndSelect('component.category', 'category')
            .where('a.status = :status', { status: stock_alert_entity_1.AlertStatus.ACTIVE })
            .orderBy('a.created_at', 'DESC');
        if (warehouseId)
            qb.andWhere('a.warehouse_id = :wId', { wId: warehouseId });
        return qb.getMany();
    }
};
exports.StockAlertsService = StockAlertsService;
exports.StockAlertsService = StockAlertsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_alert_entity_1.StockAlert)),
    __param(1, (0, typeorm_1.InjectRepository)(component_entity_1.Component)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], StockAlertsService);
//# sourceMappingURL=stock-alerts.service.js.map