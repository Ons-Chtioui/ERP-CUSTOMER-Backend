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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const order_line_entity_1 = require("./entities/order-line.entity");
const order_status_history_entity_1 = require("./entities/order-status-history.entity");
const product_entity_1 = require("../products/entities/product.entity");
const bom_line_entity_1 = require("../products/entities/bom-line.entity");
const product_inventory_entity_1 = require("../products/entities/product-inventory.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
const warehouse_entity_1 = require("../warehouses/entities/warehouse.entity");
const products_service_1 = require("../products/products.service");
const DEFAULT_TVA = 19;
const STATUS_TRANSITIONS = {
    [order_entity_1.OrderStatus.DRAFT]: [order_entity_1.OrderStatus.CONFIRMED, order_entity_1.OrderStatus.CANCELLED],
    [order_entity_1.OrderStatus.CONFIRMED]: [order_entity_1.OrderStatus.PREPARING, order_entity_1.OrderStatus.CANCELLED],
    [order_entity_1.OrderStatus.PREPARING]: [order_entity_1.OrderStatus.SHIPPED, order_entity_1.OrderStatus.CANCELLED],
    [order_entity_1.OrderStatus.SHIPPED]: [order_entity_1.OrderStatus.DELIVERED],
    [order_entity_1.OrderStatus.DELIVERED]: [],
    [order_entity_1.OrderStatus.CANCELLED]: [],
};
let OrdersService = class OrdersService {
    orderRepo;
    lineRepo;
    historyRepo;
    productRepo;
    productInventoryRepo;
    bomRepo;
    inventoryItemRepo;
    warehouseRepo;
    dataSource;
    productsService;
    constructor(orderRepo, lineRepo, historyRepo, productRepo, productInventoryRepo, bomRepo, inventoryItemRepo, warehouseRepo, dataSource, productsService) {
        this.orderRepo = orderRepo;
        this.lineRepo = lineRepo;
        this.historyRepo = historyRepo;
        this.productRepo = productRepo;
        this.productInventoryRepo = productInventoryRepo;
        this.bomRepo = bomRepo;
        this.inventoryItemRepo = inventoryItemRepo;
        this.warehouseRepo = warehouseRepo;
        this.dataSource = dataSource;
        this.productsService = productsService;
    }
    async generateReference() {
        const year = new Date().getFullYear();
        const count = await this.orderRepo.count();
        return `CMD-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async getProductPricing(productId) {
        const product = await this.productRepo.findOne({ where: { id: productId } });
        if (!product)
            throw new common_1.NotFoundException(`Produit ${productId} introuvable`);
        const unitPrice = Number(product.prixVente) > 0
            ? Number(product.prixVente)
            : Number(product.prixVenteAuto);
        return { product, unitPrice, tvaRate: DEFAULT_TVA };
    }
    async getLineFulfillment(productId, quantity) {
        const stock = await this.productsService.getOrderStockSummary(productId);
        const fromStock = Math.min(quantity, stock.stockFini);
        const fromAssembly = Math.min(quantity - fromStock, stock.stockFabricable);
        return {
            fromStock,
            fromAssembly,
            stockFini: stock.stockFini,
            stockFabricable: stock.stockFabricable,
            stockTotal: stock.stockTotal,
        };
    }
    async getFinishedStockTotal(productId, manager) {
        const repo = manager ? manager.getRepository(product_inventory_entity_1.ProductInventory) : this.productInventoryRepo;
        const raw = await repo
            .createQueryBuilder('pi')
            .select('COALESCE(SUM(pi.quantity), 0)', 'total')
            .where('pi.product_id = :productId', { productId })
            .getRawOne();
        return Number(raw?.total ?? 0);
    }
    async deductFinishedStock(manager, productId, quantity) {
        const items = await manager
            .createQueryBuilder(product_inventory_entity_1.ProductInventory, 'pi')
            .where('pi.product_id = :productId', { productId })
            .orderBy('pi.quantity', 'DESC')
            .setLock('pessimistic_write')
            .getMany();
        let remaining = quantity;
        for (const item of items) {
            if (remaining <= 0)
                break;
            const take = Math.min(Number(item.quantity), remaining);
            item.quantity = Number(item.quantity) - take;
            remaining -= take;
            await manager.save(product_inventory_entity_1.ProductInventory, item);
        }
        if (remaining > 0) {
            throw new common_1.BadRequestException(`Stock produit fini insuffisant (productId=${productId})`);
        }
    }
    async restoreFinishedStock(manager, productId, quantity) {
        if (quantity <= 0)
            return;
        let item = await manager.findOne(product_inventory_entity_1.ProductInventory, {
            where: { product: { id: productId } },
            order: { quantity: 'DESC' },
            lock: { mode: 'pessimistic_write' },
        });
        if (item) {
            item.quantity = Number(item.quantity) + quantity;
            await manager.save(product_inventory_entity_1.ProductInventory, item);
            return;
        }
        const warehouses = await manager.find(warehouse_entity_1.Warehouse, { take: 1 });
        if (warehouses.length === 0)
            return;
        await manager.save(product_inventory_entity_1.ProductInventory, manager.create(product_inventory_entity_1.ProductInventory, {
            product: { id: productId },
            warehouse: { id: warehouses[0].id },
            quantity,
        }));
    }
    async deductComponents(manager, productId, quantity, productName) {
        const bomLines = await manager.find(bom_line_entity_1.BomLine, {
            where: { product: { id: productId } },
            relations: { component: true },
        });
        if (bomLines.length === 0) {
            throw new common_1.BadRequestException(`Impossible d'assembler ${productName ?? 'le produit'} : nomenclature (BOM) absente`);
        }
        for (const bom of bomLines) {
            const needed = Number(bom.quantity) * quantity;
            const items = await manager
                .createQueryBuilder(inventory_item_entity_1.InventoryItem, 'i')
                .where('i.component_id = :cId', { cId: bom.component.id })
                .orderBy('i.quantity', 'DESC')
                .setLock('pessimistic_write')
                .getMany();
            let remaining = needed;
            for (const item of items) {
                if (remaining <= 0)
                    break;
                const take = Math.min(Number(item.quantity), remaining);
                item.quantity = Number(item.quantity) - take;
                remaining -= take;
                await manager.save(inventory_item_entity_1.InventoryItem, item);
            }
            if (remaining > 0) {
                throw new common_1.BadRequestException(`Stock composant insuffisant: ${bom.component.nom}`);
            }
        }
    }
    async restoreComponents(manager, productId, quantity) {
        if (quantity <= 0)
            return;
        const bomLines = await manager.find(bom_line_entity_1.BomLine, {
            where: { product: { id: productId } },
            relations: { component: true },
        });
        for (const bom of bomLines) {
            const toRestore = Number(bom.quantity) * quantity;
            const items = await manager
                .createQueryBuilder(inventory_item_entity_1.InventoryItem, 'i')
                .where('i.component_id = :cId', { cId: bom.component.id })
                .orderBy('i.quantity', 'ASC')
                .getMany();
            let rem = toRestore;
            for (const item of items) {
                if (rem <= 0)
                    break;
                const add = Math.min(100, rem);
                item.quantity = Number(item.quantity) + add;
                rem -= add;
                await manager.save(inventory_item_entity_1.InventoryItem, item);
            }
            if (rem > 0) {
                const warehouses = await manager.find(warehouse_entity_1.Warehouse, { take: 1 });
                if (warehouses.length > 0) {
                    await manager.save(inventory_item_entity_1.InventoryItem, manager.create(inventory_item_entity_1.InventoryItem, {
                        component: { id: bom.component.id },
                        warehouse: { id: warehouses[0].id },
                        quantity: rem,
                        reservedQty: 0,
                    }));
                }
            }
        }
    }
    async create(dto, userId) {
        const order = await this.orderRepo.save(this.orderRepo.create({
            reference: await this.generateReference(),
            clientId: dto.clientId,
            note: dto.note ?? null,
            discount: dto.discount ?? 0,
            createdBy: userId,
            status: order_entity_1.OrderStatus.DRAFT,
        }));
        const { totalHt, totalTva } = await this.saveLines(order.id, dto.lines ?? [], dto.discount ?? 0);
        await this.orderRepo.update(order.id, {
            totalHt: round(totalHt),
            totalTva: round(totalTva),
            totalTtc: round(totalHt + totalTva),
        });
        await this.recordHistory(order.id, null, order_entity_1.OrderStatus.DRAFT, userId);
        return this.findOne(order.id);
    }
    async saveLines(orderId, lines, globalDiscount) {
        let totalHt = 0;
        let totalTva = 0;
        for (const item of lines) {
            const { unitPrice, tvaRate } = await this.getProductPricing(item.productId);
            const ld = item.discount ?? 0;
            const lineHt = item.quantity * unitPrice * (1 - ld / 100);
            const lineTva = lineHt * (tvaRate / 100);
            totalHt += lineHt;
            totalTva += lineTva;
            await this.lineRepo.save(this.lineRepo.create({
                orderId,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice,
                tvaRate,
                discount: ld,
                totalHt: round(lineHt),
                qtyFromStock: 0,
                qtyFromAssembly: 0,
            }));
        }
        totalHt *= (1 - globalDiscount / 100);
        totalTva *= (1 - globalDiscount / 100);
        return { totalHt, totalTva };
    }
    async checkStock(order) {
        const missing = [];
        for (const line of order.lines) {
            const fulfillment = await this.getLineFulfillment(line.productId, line.quantity);
            if (fulfillment.fromStock + fulfillment.fromAssembly < line.quantity) {
                missing.push({
                    type: 'product',
                    name: line.product?.nom ?? 'Produit',
                    available: fulfillment.stockTotal,
                    stockFini: fulfillment.stockFini,
                    stockFabricable: fulfillment.stockFabricable,
                    needed: line.quantity,
                });
            }
        }
        if (missing.length > 0) {
            throw new common_1.BadRequestException({ message: 'Stock insuffisant', missing });
        }
    }
    async deductStock(order, _userId) {
        await this.dataSource.transaction(async (manager) => {
            for (const line of order.lines) {
                const stockFini = await this.getFinishedStockTotal(line.productId, manager);
                const { stockDisponible: stockFabricable } = await this.productsService.getAvailability(line.productId);
                const fromStock = Math.min(line.quantity, stockFini);
                const fromAssembly = line.quantity - fromStock;
                if (fromAssembly > stockFabricable) {
                    throw new common_1.BadRequestException(`Stock insuffisant pour ${line.product?.nom}`);
                }
                if (fromAssembly > 0) {
                    const bomCount = await manager.count(bom_line_entity_1.BomLine, { where: { product: { id: line.productId } } });
                    if (bomCount === 0) {
                        throw new common_1.BadRequestException(`Impossible d'assembler ${line.product?.nom} : nomenclature (BOM) absente`);
                    }
                }
                if (fromStock > 0) {
                    await this.deductFinishedStock(manager, line.productId, fromStock);
                }
                if (fromAssembly > 0) {
                    await this.deductComponents(manager, line.productId, fromAssembly, line.product?.nom);
                }
                await manager.update(order_line_entity_1.OrderLine, line.id, {
                    qtyFromStock: fromStock,
                    qtyFromAssembly: fromAssembly,
                });
            }
        });
    }
    async restoreStock(order) {
        await this.dataSource.transaction(async (manager) => {
            for (const line of order.lines) {
                let fromStock = Number(line.qtyFromStock ?? 0);
                let fromAssembly = Number(line.qtyFromAssembly ?? 0);
                if (fromStock === 0 && fromAssembly === 0) {
                    fromStock = line.quantity;
                }
                if (fromStock > 0) {
                    await this.restoreFinishedStock(manager, line.productId, fromStock);
                }
                if (fromAssembly > 0) {
                    await this.restoreComponents(manager, line.productId, fromAssembly);
                }
                await manager.update(order_line_entity_1.OrderLine, line.id, {
                    qtyFromStock: 0,
                    qtyFromAssembly: 0,
                });
            }
        });
    }
    async updateStatus(id, dto, userId) {
        const order = await this.findOne(id);
        const allowed = STATUS_TRANSITIONS[order.status];
        if (!allowed.includes(dto.status)) {
            throw new common_1.BadRequestException(`Transition ${order.status} → ${dto.status} non autorisée`);
        }
        const fromStatus = order.status;
        if (dto.status === order_entity_1.OrderStatus.CONFIRMED) {
            await this.checkStock(order);
            await this.deductStock(order, userId);
        }
        if (dto.status === order_entity_1.OrderStatus.CANCELLED && order.status !== order_entity_1.OrderStatus.DRAFT) {
            await this.restoreStock(order);
        }
        const patch = { status: dto.status };
        if (dto.status === order_entity_1.OrderStatus.CONFIRMED)
            patch.confirmedAt = new Date();
        if (dto.status === order_entity_1.OrderStatus.SHIPPED)
            patch.shippedAt = new Date();
        if (dto.status === order_entity_1.OrderStatus.DELIVERED)
            patch.deliveredAt = new Date();
        if (dto.status === order_entity_1.OrderStatus.CANCELLED) {
            patch.cancelledAt = new Date();
            patch.cancelledBy = userId;
        }
        await this.orderRepo.update(id, patch);
        await this.recordHistory(id, fromStatus, dto.status, userId, dto.comment);
        return this.findOne(id);
    }
    async updateLines(id, dto, userId) {
        const order = await this.findOne(id);
        if (order.status !== order_entity_1.OrderStatus.DRAFT) {
            throw new common_1.BadRequestException('Seules les commandes en brouillon peuvent être modifiées');
        }
        await this.lineRepo.delete({ orderId: id });
        const lines = dto.lines ?? [];
        const globalDiscount = dto.discount ?? Number(order.discount);
        const { totalHt, totalTva } = await this.saveLines(id, lines, globalDiscount);
        await this.orderRepo.update(id, {
            discount: globalDiscount,
            note: dto.note ?? order.note,
            clientId: dto.clientId ?? order.clientId,
            totalHt: round(totalHt),
            totalTva: round(totalTva),
            totalTtc: round(totalHt + totalTva),
        });
        return this.findOne(id);
    }
    async findAll(query) {
        const qb = this.orderRepo
            .createQueryBuilder('o')
            .leftJoinAndSelect('o.client', 'client')
            .leftJoinAndSelect('o.lines', 'lines')
            .leftJoinAndSelect('lines.product', 'product')
            .leftJoinAndSelect('o.creator', 'creator')
            .orderBy('o.created_at', 'DESC');
        if (query.status)
            qb.andWhere('o.status = :status', { status: query.status });
        if (query.clientId)
            qb.andWhere('o.client_id = :clientId', { clientId: query.clientId });
        if (query.dateFrom)
            qb.andWhere('o.created_at >= :dateFrom', { dateFrom: query.dateFrom });
        if (query.dateTo)
            qb.andWhere('o.created_at <= :dateTo', { dateTo: query.dateTo });
        const total = await qb.getCount();
        const page = query.page ?? 1;
        const limit = query.limit ?? 20;
        qb.skip((page - 1) * limit).take(limit);
        const data = await qb.getMany();
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: {
                client: true,
                lines: { product: true },
                statusHistory: { user: true },
                creator: true,
            },
        });
        if (!order)
            throw new common_1.NotFoundException(`Commande #${id} introuvable`);
        return order;
    }
    async getStats() {
        const stats = await this.orderRepo
            .createQueryBuilder('o')
            .select('o.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(o.total_ttc)', 'total')
            .groupBy('o.status')
            .getRawMany();
        const totalOrders = stats.reduce((s, r) => s + Number(r.count), 0);
        const totalRevenue = stats.reduce((s, r) => s + Number(r.total ?? 0), 0);
        return {
            stats,
            totalOrders,
            totalRevenue,
            avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
        };
    }
    async checkAvailability(id) {
        const order = await this.findOne(id);
        const lines = [];
        const missing = [];
        for (const line of order.lines) {
            const fulfillment = await this.getLineFulfillment(line.productId, line.quantity);
            const canFulfill = fulfillment.fromStock + fulfillment.fromAssembly >= line.quantity;
            const lineInfo = {
                productId: line.productId,
                name: line.product?.nom,
                quantity: line.quantity,
                stockFini: fulfillment.stockFini,
                stockFabricable: fulfillment.stockFabricable,
                stockTotal: fulfillment.stockTotal,
                fromStock: fulfillment.fromStock,
                fromAssembly: fulfillment.fromAssembly,
                canFulfill,
            };
            lines.push(lineInfo);
            if (!canFulfill) {
                missing.push({
                    ...lineInfo,
                    available: fulfillment.stockTotal,
                    needed: line.quantity,
                });
            }
        }
        return {
            orderId: id,
            reference: order.reference,
            canConfirm: missing.length === 0,
            lines,
            missing,
        };
    }
    async previewLineFulfillment(productId, quantity) {
        return this.productsService.getFulfillmentPreview(productId, quantity);
    }
    async remove(id) {
        const order = await this.findOne(id);
        if (order.status !== order_entity_1.OrderStatus.DRAFT) {
            throw new common_1.BadRequestException('Seules les commandes en brouillon peuvent être supprimées');
        }
        await this.orderRepo.remove(order);
    }
    async recordHistory(orderId, fromStatus, toStatus, changedBy, comment) {
        await this.historyRepo.save(this.historyRepo.create({
            orderId,
            fromStatus,
            toStatus,
            changedBy,
            comment: comment ?? null,
        }));
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_line_entity_1.OrderLine)),
    __param(2, (0, typeorm_1.InjectRepository)(order_status_history_entity_1.OrderStatusHistory)),
    __param(3, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(4, (0, typeorm_1.InjectRepository)(product_inventory_entity_1.ProductInventory)),
    __param(5, (0, typeorm_1.InjectRepository)(bom_line_entity_1.BomLine)),
    __param(6, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(7, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __param(8, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        products_service_1.ProductsService])
], OrdersService);
function round(n) {
    return Math.round(n * 1000) / 1000;
}
//# sourceMappingURL=orders.service.js.map