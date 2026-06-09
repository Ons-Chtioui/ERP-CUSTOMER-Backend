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
exports.WarehousesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const warehouse_entity_1 = require("./entities/warehouse.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
let WarehousesService = class WarehousesService {
    warehousesRepo;
    inventoryRepo;
    constructor(warehousesRepo, inventoryRepo) {
        this.warehousesRepo = warehousesRepo;
        this.inventoryRepo = inventoryRepo;
    }
    async findAll() {
        return this.warehousesRepo.find({ order: { nom: 'ASC' } });
    }
    async findOne(id) {
        const w = await this.warehousesRepo.findOne({ where: { id } });
        if (!w)
            throw new common_1.NotFoundException(`Entrepôt #${id} introuvable`);
        return w;
    }
    async create(dto) {
        const existing = await this.warehousesRepo.findOne({
            where: { code: dto.code.toUpperCase() },
        });
        if (existing)
            throw new common_1.ConflictException(`Code "${dto.code}" déjà utilisé`);
        return this.warehousesRepo.save(this.warehousesRepo.create({ ...dto, code: dto.code.toUpperCase() }));
    }
    async update(id, dto) {
        const w = await this.findOne(id);
        if (dto.code && dto.code.toUpperCase() !== w.code) {
            const existing = await this.warehousesRepo.findOne({
                where: { code: dto.code.toUpperCase() },
            });
            if (existing)
                throw new common_1.ConflictException(`Code "${dto.code}" déjà utilisé`);
            dto.code = dto.code.toUpperCase();
        }
        Object.assign(w, dto);
        return this.warehousesRepo.save(w);
    }
    async toggleActive(id) {
        const w = await this.findOne(id);
        w.isActive = !w.isActive;
        return this.warehousesRepo.save(w);
    }
    async getStock(warehouseId) {
        await this.findOne(warehouseId);
        return this.inventoryRepo
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.component', 'component')
            .leftJoinAndSelect('component.category', 'category')
            .leftJoinAndSelect('component.supplier', 'supplier')
            .where('item.warehouse_id = :warehouseId', { warehouseId })
            .orderBy('component.nom', 'ASC')
            .getMany();
    }
    async getGlobalSummary() {
        const warehouses = await this.warehousesRepo.find({ where: { isActive: true } });
        return Promise.all(warehouses.map(async (wh) => {
            const items = await this.inventoryRepo.find({
                where: { warehouse: { id: wh.id } },
                relations: { component: true },
            });
            return {
                warehouse: wh,
                totalItems: items.length,
                totalQuantity: items.reduce((s, i) => s + Number(i.quantity), 0),
                totalValue: Math.round(items.reduce((s, i) => s + Number(i.quantity) * Number(i.component?.prixAchat ?? 0), 0)
                    * 100) / 100,
            };
        }));
    }
};
exports.WarehousesService = WarehousesService;
exports.WarehousesService = WarehousesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], WarehousesService);
//# sourceMappingURL=warehouses.service.js.map