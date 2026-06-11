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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
const bom_line_entity_1 = require("./entities/bom-line.entity");
const production_log_entity_1 = require("./entities/production-log.entity");
const product_inventory_entity_1 = require("./entities/product-inventory.entity");
const component_entity_1 = require("../components/entities/component.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
const warehouse_entity_1 = require("../warehouses/entities/warehouse.entity");
const product_category_entity_1 = require("../product-categories/entities/product-category.entity");
const stock_movement_entity_1 = require("../stock-movements/entities/stock-movement.entity");
let ProductsService = class ProductsService {
    productsRepo;
    bomRepo;
    logsRepo;
    productInventoryRepo;
    inventoryRepo;
    componentsRepo;
    warehousesRepo;
    categoriesRepo;
    dataSource;
    constructor(productsRepo, bomRepo, logsRepo, productInventoryRepo, inventoryRepo, componentsRepo, warehousesRepo, categoriesRepo, dataSource) {
        this.productsRepo = productsRepo;
        this.bomRepo = bomRepo;
        this.logsRepo = logsRepo;
        this.productInventoryRepo = productInventoryRepo;
        this.inventoryRepo = inventoryRepo;
        this.componentsRepo = componentsRepo;
        this.warehousesRepo = warehousesRepo;
        this.categoriesRepo = categoriesRepo;
        this.dataSource = dataSource;
    }
    async findAll(filter) {
        const qb = this.productsRepo.createQueryBuilder('p')
            .leftJoinAndSelect('p.category', 'category')
            .leftJoinAndSelect('p.parent', 'parent')
            .leftJoinAndSelect('p.variants', 'variants')
            .where('p.is_active = true');
        if (filter?.categoryId)
            qb.andWhere('p.category_id = :catId', { catId: filter.categoryId });
        if (filter?.parentId)
            qb.andWhere('p.parent_id = :pid', { pid: filter.parentId });
        if (filter?.search)
            qb.andWhere('(p.nom ILIKE :s OR p.reference ILIKE :s)', { s: `%${filter.search}%` });
        return qb.orderBy('p.nom', 'ASC').getMany();
    }
    async findOne(id) {
        const p = await this.productsRepo.findOne({
            where: { id },
            relations: { category: true, parent: true, variants: true, bomLines: { component: true } },
        });
        if (!p)
            throw new common_1.NotFoundException(`Produit #${id} introuvable`);
        return p;
    }
    async create(dto) {
        const existing = await this.productsRepo.findOne({ where: { reference: dto.reference } });
        if (existing)
            throw new common_1.ConflictException(`Référence "${dto.reference}" déjà utilisée`);
        const product = this.productsRepo.create({
            nom: dto.nom,
            reference: dto.reference,
            description: dto.description,
            unite: dto.unite ?? 'unité',
            prixVente: dto.prixVente ?? 0,
            coutMO: dto.coutMO ?? 0,
            seuilAlerte: dto.seuilAlerte ?? 0,
        });
        if (dto.categoryId) {
            const cat = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
            if (!cat)
                throw new common_1.NotFoundException(`Catégorie #${dto.categoryId} introuvable`);
            product.category = cat;
        }
        if (dto.parentId) {
            const parent = await this.productsRepo.findOne({ where: { id: dto.parentId }, relations: { parent: true } });
            if (!parent)
                throw new common_1.NotFoundException(`Produit parent #${dto.parentId} introuvable`);
            if (parent.parent !== null)
                throw new common_1.BadRequestException('Les variantes ne peuvent avoir qu\'un seul niveau de hiérarchie');
            product.parent = parent;
        }
        return this.productsRepo.save(product);
    }
    async update(id, dto) {
        const p = await this.findOne(id);
        if (dto.reference && dto.reference !== p.reference) {
            const dup = await this.productsRepo.findOne({ where: { reference: dto.reference } });
            if (dup)
                throw new common_1.ConflictException(`Référence "${dto.reference}" déjà utilisée`);
        }
        if (dto.categoryId !== undefined) {
            if (dto.categoryId === null) {
                p.category = null;
            }
            else {
                const cat = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
                if (!cat)
                    throw new common_1.NotFoundException(`Catégorie #${dto.categoryId} introuvable`);
                p.category = cat;
            }
        }
        Object.assign(p, {
            nom: dto.nom ?? p.nom,
            reference: dto.reference ?? p.reference,
            description: dto.description ?? p.description,
            unite: dto.unite ?? p.unite,
            prixVente: dto.prixVente ?? p.prixVente,
            seuilAlerte: dto.seuilAlerte ?? p.seuilAlerte,
        });
        if (dto.coutMO !== undefined && dto.coutMO !== Number(p.coutMO)) {
            p.coutMO = dto.coutMO;
            await this.productsRepo.save(p);
            await this.recalcCoutRevient(p.id);
            return this.findOne(p.id);
        }
        return this.productsRepo.save(p);
    }
    async archive(id) {
        await this.findOne(id);
        await this.productsRepo.update(id, { isActive: false });
        return this.findOne(id);
    }
    async getBom(productId) {
        await this.findOne(productId);
        return this.bomRepo.find({
            where: { product: { id: productId } },
            relations: { component: true },
        });
    }
    async setBom(productId, dto) {
        const product = await this.findOne(productId);
        const componentIds = dto.lines.map(l => l.componentId);
        const components = await this.componentsRepo.findBy({ id: (0, typeorm_2.In)(componentIds) });
        if (components.length !== componentIds.length) {
            const found = components.map(c => c.id);
            const missing = componentIds.filter(id => !found.includes(id));
            throw new common_1.NotFoundException(`Composants introuvables : [${missing.join(', ')}]`);
        }
        return this.dataSource.transaction(async (manager) => {
            await manager.delete(bom_line_entity_1.BomLine, { product: { id: productId } });
            const lines = dto.lines.map(l => manager.create(bom_line_entity_1.BomLine, {
                product: { id: productId },
                component: { id: l.componentId },
                quantity: l.quantity,
            }));
            await manager.save(bom_line_entity_1.BomLine, lines);
            const comp = await manager.find(component_entity_1.Component, { where: { id: (0, typeorm_2.In)(componentIds) } });
            const coutMO = Number(product.coutMO);
            const coutComponents = dto.lines.reduce((sum, line) => {
                const c = comp.find(c => c.id === line.componentId);
                return sum + (line.quantity * Number(c?.prixAchat ?? 0));
            }, 0);
            const venteComponents = dto.lines.reduce((sum, line) => {
                const c = comp.find(c => c.id === line.componentId);
                return sum + (line.quantity * Number(c?.prixVente ?? 0));
            }, 0);
            await manager.update(product_entity_1.Product, productId, {
                coutRevient: coutComponents + coutMO,
                prixVenteAuto: venteComponents + coutMO,
            });
            return manager.find(bom_line_entity_1.BomLine, {
                where: { product: { id: productId } },
                relations: { component: true },
            });
        });
    }
    async upsertBomLine(productId, componentId, quantity) {
        await this.findOne(productId);
        const component = await this.componentsRepo.findOne({ where: { id: componentId } });
        if (!component)
            throw new common_1.NotFoundException(`Composant #${componentId} introuvable`);
        let line = await this.bomRepo.findOne({
            where: { product: { id: productId }, component: { id: componentId } },
        });
        if (line) {
            line.quantity = quantity;
            await this.bomRepo.save(line);
        }
        else {
            line = await this.bomRepo.save(this.bomRepo.create({
                product: { id: productId },
                component: { id: componentId },
                quantity,
            }));
        }
        await this.recalcCoutRevient(productId);
        return line;
    }
    async deleteBomLine(productId, componentId) {
        await this.bomRepo.delete({
            product: { id: productId },
            component: { id: componentId },
        });
        await this.recalcCoutRevient(productId);
    }
    async recalcCoutRevient(productId) {
        const product = await this.productsRepo.findOne({
            where: { id: productId },
            relations: { bomLines: { component: true } },
        });
        if (!product)
            return;
        const coutMO = Number(product.coutMO);
        const coutComponents = product.bomLines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.component.prixAchat), 0);
        const venteComponents = product.bomLines.reduce((sum, line) => sum + Number(line.quantity) * Number(line.component.prixVente), 0);
        await this.productsRepo.update(productId, {
            coutRevient: coutComponents + coutMO,
            prixVenteAuto: venteComponents + coutMO,
        });
    }
    async recalcForComponent(componentId) {
        const lines = await this.bomRepo.find({
            where: { component: { id: componentId } },
            select: { product: { id: true } },
            relations: { product: true },
        });
        const productIds = [...new Set(lines.map(l => l.product.id))];
        await Promise.all(productIds.map(id => this.recalcCoutRevient(id)));
    }
    async getAvailability(productId, warehouseId) {
        const bom = await this.getBom(productId);
        if (bom.length === 0)
            return { stockDisponible: 0, goulot: null, details: [] };
        const details = [];
        let minFabricable = Infinity;
        let goulot = null;
        for (const line of bom) {
            let stockDispo = 0;
            if (warehouseId) {
                const item = await this.inventoryRepo.findOne({
                    where: { warehouse: { id: warehouseId }, component: { id: line.component.id } },
                });
                stockDispo = Number(item?.quantity ?? 0);
            }
            else {
                const items = await this.inventoryRepo.find({
                    where: { component: { id: line.component.id } },
                });
                stockDispo = items.reduce((s, i) => s + Number(i.quantity), 0);
            }
            const fabricable = Math.floor(stockDispo / Number(line.quantity));
            if (fabricable < minFabricable) {
                minFabricable = fabricable;
                goulot = { componentId: line.component.id, nom: line.component.nom, fabricable };
            }
            details.push({
                componentId: line.component.id,
                nom: line.component.nom,
                reference: line.component.reference,
                qteBom: Number(line.quantity),
                stockDispo,
                fabricable,
                isGoulot: false,
            });
        }
        if (goulot) {
            const g = details.find(d => d.componentId === goulot.componentId);
            if (g)
                g.isGoulot = true;
        }
        return {
            stockDisponible: minFabricable === Infinity ? 0 : minFabricable,
            goulot,
            details,
        };
    }
    async simulate(productId, quantity, warehouseId) {
        const product = await this.findOne(productId);
        const bom = await this.getBom(productId);
        if (bom.length === 0)
            throw new common_1.BadRequestException('Ce produit n\'a pas de nomenclature (BOM)');
        const manquants = [];
        let coutTotal = 0;
        let canProduce = true;
        for (const line of bom) {
            const requis = Number(line.quantity) * quantity;
            const item = await this.inventoryRepo.findOne({
                where: { warehouse: { id: warehouseId }, component: { id: line.component.id } },
            });
            const dispo = Number(item?.quantity ?? 0);
            coutTotal += requis * Number(line.component.prixAchat);
            if (dispo < requis) {
                canProduce = false;
                manquants.push({
                    componentId: line.component.id,
                    nom: line.component.nom,
                    requis,
                    dispo,
                    manque: requis - dispo,
                });
            }
        }
        coutTotal += Number(product.coutMO) * quantity;
        return {
            canProduce,
            quantity,
            coutUnitaire: Number(product.coutRevient),
            coutTotal,
            manquants,
        };
    }
    async produce(productId, dto, userId) {
        const product = await this.findOne(productId);
        const bom = await this.getBom(productId);
        if (bom.length === 0)
            throw new common_1.BadRequestException('Impossible de produire : aucune nomenclature définie');
        const warehouse = await this.warehousesRepo.findOne({ where: { id: dto.warehouseId } });
        if (!warehouse)
            throw new common_1.NotFoundException(`Entrepôt #${dto.warehouseId} introuvable`);
        const sim = await this.simulate(productId, dto.quantity, dto.warehouseId);
        if (!sim.canProduce) {
            const missing = sim.manquants.map(m => `${m.nom}: manque ${m.manque}`).join(', ');
            throw new common_1.BadRequestException(`Stock insuffisant — ${missing}`);
        }
        return this.dataSource.transaction(async (manager) => {
            for (const line of bom) {
                const qtRequise = Number(line.quantity) * dto.quantity;
                const item = await manager.findOne(inventory_item_entity_1.InventoryItem, {
                    where: { warehouse: { id: dto.warehouseId }, component: { id: line.component.id } },
                });
                if (!item || Number(item.quantity) < qtRequise)
                    throw new common_1.BadRequestException(`Stock insuffisant pour ${line.component.nom}`);
                const before = Number(item.quantity);
                const after = before - qtRequise;
                await manager.update(inventory_item_entity_1.InventoryItem, item.id, { quantity: after });
                await manager.save(stock_movement_entity_1.StockMovement, manager.create(stock_movement_entity_1.StockMovement, {
                    warehouse: { id: dto.warehouseId },
                    component: { id: line.component.id },
                    user: { id: userId },
                    type: stock_movement_entity_1.MovementType.OUT,
                    quantity: qtRequise,
                    quantityBefore: before,
                    quantityAfter: after,
                    referenceDoc: `PROD-${productId}`,
                    notes: `Production ${product.nom} × ${dto.quantity}`,
                }));
            }
            let productStock = await manager.findOne(product_inventory_entity_1.ProductInventory, {
                where: { product: { id: productId }, warehouse: { id: dto.warehouseId } },
            });
            if (!productStock) {
                productStock = manager.create(product_inventory_entity_1.ProductInventory, {
                    product: { id: productId },
                    warehouse: { id: dto.warehouseId },
                    quantity: 0,
                });
            }
            productStock.quantity = Number(productStock.quantity) + dto.quantity;
            await manager.save(product_inventory_entity_1.ProductInventory, productStock);
            const coutUnitaireSnapshot = Number(product.coutRevient);
            const coutTotal = coutUnitaireSnapshot * dto.quantity;
            const log = await manager.save(production_log_entity_1.ProductionLog, manager.create(production_log_entity_1.ProductionLog, {
                product: { id: productId },
                warehouse: { id: dto.warehouseId },
                user: { id: userId },
                quantity: dto.quantity,
                coutUnitaireSnapshot,
                coutTotal,
                notes: dto.notes,
            }));
            return log;
        });
    }
    async getProductInventory(productId) {
        await this.findOne(productId);
        return this.productInventoryRepo.find({
            where: { product: { id: productId } },
            relations: { warehouse: true },
        });
    }
    async transferProductStock(productId, fromWarehouseId, toWarehouseId, quantity, userId) {
        if (fromWarehouseId === toWarehouseId)
            throw new common_1.BadRequestException('Source et destination identiques');
        await this.dataSource.transaction(async (manager) => {
            const src = await manager.findOne(product_inventory_entity_1.ProductInventory, {
                where: { product: { id: productId }, warehouse: { id: fromWarehouseId } },
            });
            if (!src || Number(src.quantity) < quantity)
                throw new common_1.BadRequestException('Stock insuffisant dans l\'entrepôt source');
            src.quantity = Number(src.quantity) - quantity;
            await manager.save(product_inventory_entity_1.ProductInventory, src);
            let dst = await manager.findOne(product_inventory_entity_1.ProductInventory, {
                where: { product: { id: productId }, warehouse: { id: toWarehouseId } },
            });
            if (!dst) {
                dst = manager.create(product_inventory_entity_1.ProductInventory, {
                    product: { id: productId },
                    warehouse: { id: toWarehouseId },
                    quantity: 0,
                });
            }
            dst.quantity = Number(dst.quantity) + quantity;
            await manager.save(product_inventory_entity_1.ProductInventory, dst);
        });
    }
    async getProductionLogs(productId) {
        return this.logsRepo.find({
            where: { product: { id: productId } },
            relations: { warehouse: true, user: true },
            order: { producedAt: 'DESC' },
        });
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(bom_line_entity_1.BomLine)),
    __param(2, (0, typeorm_1.InjectRepository)(production_log_entity_1.ProductionLog)),
    __param(3, (0, typeorm_1.InjectRepository)(product_inventory_entity_1.ProductInventory)),
    __param(4, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(5, (0, typeorm_1.InjectRepository)(component_entity_1.Component)),
    __param(6, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __param(7, (0, typeorm_1.InjectRepository)(product_category_entity_1.ProductCategory)),
    __param(8, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], ProductsService);
//# sourceMappingURL=products.service.js.map