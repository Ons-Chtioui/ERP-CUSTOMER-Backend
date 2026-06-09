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
exports.StockMovementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stock_movement_entity_1 = require("./entities/stock-movement.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
const stock_alerts_service_1 = require("../stock-alerts/stock-alerts.service");
let StockMovementsService = class StockMovementsService {
    movementsRepo;
    inventoryRepo;
    dataSource;
    alertsService;
    constructor(movementsRepo, inventoryRepo, dataSource, alertsService) {
        this.movementsRepo = movementsRepo;
        this.inventoryRepo = inventoryRepo;
        this.dataSource = dataSource;
        this.alertsService = alertsService;
    }
    async createIn(dto, userId) {
        return this.dataSource.transaction(async (manager) => {
            if (dto.quantity <= 0)
                throw new common_1.BadRequestException('La quantité doit être positive');
            const item = await this.getOrCreate(manager, dto.warehouseId, dto.componentId);
            const before = Number(item.quantity);
            const after = before + dto.quantity;
            await manager.update(inventory_item_entity_1.InventoryItem, { id: item.id }, { quantity: after });
            const movement = manager.save(stock_movement_entity_1.StockMovement, manager.create(stock_movement_entity_1.StockMovement, {
                warehouse: { id: dto.warehouseId },
                component: { id: dto.componentId },
                user: { id: userId },
                type: stock_movement_entity_1.MovementType.IN,
                quantity: dto.quantity,
                quantityBefore: before,
                quantityAfter: after,
                referenceDoc: dto.referenceDoc,
                notes: dto.notes,
            }));
            await this.alertsService.checkAndCreate(manager, dto.warehouseId, dto.componentId, after);
            return movement;
        });
    }
    async createOut(dto, userId) {
        return this.dataSource.transaction(async (manager) => {
            if (dto.quantity <= 0)
                throw new common_1.BadRequestException('La quantité doit être positive');
            const item = await this.getOrFail(manager, dto.warehouseId, dto.componentId);
            const before = Number(item.quantity);
            if (dto.quantity > before)
                throw new common_1.BadRequestException(`Stock insuffisant. Disponible: ${before}, demandé: ${dto.quantity}`);
            const after = before - dto.quantity;
            await manager.update(inventory_item_entity_1.InventoryItem, item.id, { quantity: after });
            const movement = await manager.save(stock_movement_entity_1.StockMovement, manager.create(stock_movement_entity_1.StockMovement, {
                warehouse: { id: dto.warehouseId },
                component: { id: dto.componentId },
                user: { id: userId },
                type: stock_movement_entity_1.MovementType.OUT,
                quantity: dto.quantity,
                quantityBefore: before,
                quantityAfter: after,
                referenceDoc: dto.referenceDoc,
                notes: dto.notes,
            }));
            await this.alertsService.checkAndCreate(manager, dto.warehouseId, dto.componentId, after);
            return movement;
        });
    }
    async createTransfer(dto, userId) {
        if (dto.warehouseId === dto.targetWarehouseId)
            throw new common_1.BadRequestException('Source et destination identiques');
        return this.dataSource.transaction(async (manager) => {
            if (dto.quantity <= 0)
                throw new common_1.BadRequestException('La quantité doit être positive');
            const srcItem = await this.getOrFail(manager, dto.warehouseId, dto.componentId);
            const srcBefore = Number(srcItem.quantity);
            if (dto.quantity > srcBefore)
                throw new common_1.BadRequestException(`Stock insuffisant dans la source. Disponible: ${srcBefore}`);
            const dstItem = await this.getOrCreate(manager, dto.targetWarehouseId, dto.componentId);
            const dstBefore = Number(dstItem.quantity);
            const srcAfter = srcBefore - dto.quantity;
            const dstAfter = dstBefore + dto.quantity;
            await manager.update(inventory_item_entity_1.InventoryItem, srcItem.id, { quantity: srcAfter });
            await manager.update(inventory_item_entity_1.InventoryItem, dstItem.id, { quantity: dstAfter });
            const [outMov, inMov] = await manager.save(stock_movement_entity_1.StockMovement, [
                manager.create(stock_movement_entity_1.StockMovement, {
                    warehouse: { id: dto.warehouseId },
                    component: { id: dto.componentId },
                    user: { id: userId },
                    type: stock_movement_entity_1.MovementType.TRANSFER,
                    quantity: dto.quantity,
                    quantityBefore: srcBefore, quantityAfter: srcAfter,
                    targetWarehouse: { id: dto.targetWarehouseId },
                    referenceDoc: dto.referenceDoc, notes: dto.notes,
                }),
                manager.create(stock_movement_entity_1.StockMovement, {
                    warehouse: { id: dto.targetWarehouseId },
                    component: { id: dto.componentId },
                    user: { id: userId },
                    type: stock_movement_entity_1.MovementType.TRANSFER,
                    quantity: dto.quantity,
                    quantityBefore: dstBefore, quantityAfter: dstAfter,
                    targetWarehouse: { id: dto.warehouseId },
                    referenceDoc: dto.referenceDoc, notes: dto.notes,
                }),
            ]);
            await this.alertsService.checkAndCreate(manager, dto.warehouseId, dto.componentId, srcAfter);
            await this.alertsService.checkAndCreate(manager, dto.targetWarehouseId, dto.componentId, dstAfter);
            return { outMov, inMov };
        });
    }
    async findHistory(filters) {
        const qb = this.movementsRepo
            .createQueryBuilder('m')
            .leftJoinAndSelect('m.warehouse', 'warehouse')
            .leftJoinAndSelect('m.component', 'component')
            .leftJoinAndSelect('m.user', 'user')
            .leftJoinAndSelect('m.targetWarehouse', 'target')
            .orderBy('m.created_at', 'DESC');
        if (filters.warehouseId)
            qb.andWhere('m.warehouse_id = :wId', { wId: filters.warehouseId });
        if (filters.componentId)
            qb.andWhere('m.component_id = :cId', { cId: filters.componentId });
        if (filters.type)
            qb.andWhere('m.type = :type', { type: filters.type });
        qb.take(filters.limit ?? 100);
        return qb.getMany();
    }
    async getOrCreate(manager, warehouseId, componentId) {
        let item = await manager.findOne(inventory_item_entity_1.InventoryItem, {
            where: { warehouse: { id: warehouseId }, component: { id: componentId } },
        });
        if (!item) {
            item = await manager.save(inventory_item_entity_1.InventoryItem, manager.create(inventory_item_entity_1.InventoryItem, {
                warehouse: { id: warehouseId },
                component: { id: componentId },
                quantity: 0, reservedQty: 0,
            }));
        }
        return item;
    }
    async getOrFail(manager, warehouseId, componentId) {
        const item = await manager.findOne(inventory_item_entity_1.InventoryItem, {
            where: { warehouse: { id: warehouseId }, component: { id: componentId } },
        });
        if (!item)
            throw new common_1.BadRequestException('Composant introuvable dans cet entrepôt');
        return item;
    }
};
exports.StockMovementsService = StockMovementsService;
exports.StockMovementsService = StockMovementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stock_movement_entity_1.StockMovement)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(2, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        stock_alerts_service_1.StockAlertsService])
], StockMovementsService);
//# sourceMappingURL=stock-movements.service.js.map