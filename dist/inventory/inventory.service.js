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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_session_entity_1 = require("./entities/inventory-session.entity");
const inventory_line_entity_1 = require("./entities/inventory-line.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
const component_entity_1 = require("../components/entities/component.entity");
const stock_movement_entity_1 = require("../stock-movements/entities/stock-movement.entity");
let InventoryService = class InventoryService {
    sessionsRepo;
    linesRepo;
    inventoryRepo;
    componentsRepo;
    dataSource;
    constructor(sessionsRepo, linesRepo, inventoryRepo, componentsRepo, dataSource) {
        this.sessionsRepo = sessionsRepo;
        this.linesRepo = linesRepo;
        this.inventoryRepo = inventoryRepo;
        this.componentsRepo = componentsRepo;
        this.dataSource = dataSource;
    }
    async createSession(dto, userId) {
        const active = await this.sessionsRepo.findOne({
            where: { warehouse: { id: dto.warehouseId }, status: inventory_session_entity_1.SessionStatus.IN_PROGRESS },
        });
        if (active)
            throw new common_1.BadRequestException(`Session #${active.id} déjà en cours sur cet entrepôt`);
        return this.sessionsRepo.save(this.sessionsRepo.create({
            warehouse: { id: dto.warehouseId },
            user: { id: userId },
            nom: dto.nom,
            status: inventory_session_entity_1.SessionStatus.DRAFT,
        }));
    }
    async startSession(sessionId) {
        const session = await this.sessionsRepo.findOne({
            where: { id: sessionId },
            relations: { warehouse: true },
        });
        if (!session)
            throw new common_1.NotFoundException(`Session #${sessionId} introuvable`);
        if (session.status !== inventory_session_entity_1.SessionStatus.DRAFT)
            throw new common_1.BadRequestException('La session n\'est pas en état draft');
        return this.dataSource.transaction(async (manager) => {
            const items = await this.inventoryRepo.find({
                where: { warehouse: { id: session.warehouse.id } },
                relations: { component: true },
            });
            await manager.save(inventory_line_entity_1.InventoryLine, items.map((i) => manager.create(inventory_line_entity_1.InventoryLine, {
                session: { id: sessionId },
                component: i.component,
                quantityTheoretical: i.quantity,
                quantityCounted: null,
                ecart: null,
            })));
            await manager.update(inventory_session_entity_1.InventorySession, sessionId, {
                status: inventory_session_entity_1.SessionStatus.IN_PROGRESS,
                startedAt: new Date(),
            });
            return manager.findOne(inventory_session_entity_1.InventorySession, {
                where: { id: sessionId },
                relations: { lines: true, warehouse: true },
            });
        });
    }
    async countLine(sessionId, componentId, quantityCounted, notes) {
        const session = await this.sessionsRepo.findOne({ where: { id: sessionId } });
        if (!session)
            throw new common_1.NotFoundException('Session introuvable');
        if (session.status !== inventory_session_entity_1.SessionStatus.IN_PROGRESS)
            throw new common_1.BadRequestException('Session non active');
        if (!Number.isInteger(quantityCounted) || quantityCounted < 0)
            throw new common_1.BadRequestException('La quantité doit être un entier positif ou nul');
        const line = await this.linesRepo.findOne({
            where: { session: { id: sessionId }, component: { id: componentId } },
            relations: { component: true },
        });
        if (!line)
            throw new common_1.NotFoundException('Ligne introuvable dans cette session');
        const ecart = quantityCounted - Number(line.quantityTheoretical);
        await this.linesRepo.update(line.id, {
            quantityCounted, ecart, notes, countedAt: new Date(),
        });
        return this.linesRepo.findOne({
            where: { id: line.id },
            relations: { component: true }
        });
    }
    async closeSession(sessionId, userId) {
        const session = await this.sessionsRepo.findOne({
            where: { id: sessionId },
            relations: { warehouse: true, lines: { component: true } },
        });
        if (!session)
            throw new common_1.NotFoundException('Session introuvable');
        if (session.status !== inventory_session_entity_1.SessionStatus.IN_PROGRESS)
            throw new common_1.BadRequestException('Session non active');
        const uncounted = session.lines.filter((l) => l.quantityCounted === null);
        if (uncounted.length > 0)
            throw new common_1.BadRequestException(`${uncounted.length} ligne(s) non comptée(s)`);
        return this.dataSource.transaction(async (manager) => {
            for (const line of session.lines) {
                const ecart = Number(line.ecart);
                if (ecart === 0)
                    continue;
                const item = await manager.findOne(inventory_item_entity_1.InventoryItem, {
                    where: {
                        warehouse: { id: session.warehouse.id },
                        component: { id: line.component.id }
                    },
                });
                if (!item)
                    continue;
                const before = Number(item.quantity);
                const after = Number(line.quantityCounted);
                await manager.update(inventory_item_entity_1.InventoryItem, item.id, { quantity: after });
                await manager.save(stock_movement_entity_1.StockMovement, manager.create(stock_movement_entity_1.StockMovement, {
                    warehouse: { id: session.warehouse.id },
                    component: { id: line.component.id },
                    user: { id: userId },
                    type: stock_movement_entity_1.MovementType.ADJUSTMENT,
                    quantity: Math.abs(ecart),
                    quantityBefore: before,
                    quantityAfter: after,
                    inventorySessionId: sessionId,
                    notes: `Inventaire #${sessionId} — écart: ${ecart > 0 ? '+' : ''}${ecart}`,
                }));
            }
            await manager.update(inventory_session_entity_1.InventorySession, sessionId, {
                status: inventory_session_entity_1.SessionStatus.CLOSED,
                closedAt: new Date(),
            });
            return manager.findOne(inventory_session_entity_1.InventorySession, {
                where: { id: sessionId },
                relations: { warehouse: true, lines: { component: true } },
            });
        });
    }
    async findAll(warehouseId) {
        return this.sessionsRepo.find({
            where: warehouseId ? { warehouse: { id: warehouseId } } : {},
            relations: { warehouse: true, user: true },
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const session = await this.sessionsRepo.findOne({
            where: { id },
            relations: {
                warehouse: true,
                user: true,
                lines: { component: true }
            },
        });
        if (!session)
            throw new common_1.NotFoundException(`Session #${id} introuvable`);
        return session;
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_session_entity_1.InventorySession)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_line_entity_1.InventoryLine)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(3, (0, typeorm_1.InjectRepository)(component_entity_1.Component)),
    __param(4, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map