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
exports.ComponentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const component_entity_1 = require("./entities/component.entity");
const category_entity_1 = require("./entities/category.entity");
const supplier_entity_1 = require("./entities/supplier.entity");
const inventory_item_entity_1 = require("./entities/inventory-item.entity");
function generateEAN13() {
    const prefix = '619';
    const body = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
    const digits = prefix + body;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
    }
    const check = (10 - (sum % 10)) % 10;
    return digits + check;
}
let ComponentsService = class ComponentsService {
    componentsRepo;
    categoriesRepo;
    suppliersRepo;
    inventoryRepo;
    productsService;
    setProductsService(svc) {
        this.productsService = svc;
    }
    constructor(componentsRepo, categoriesRepo, suppliersRepo, inventoryRepo) {
        this.componentsRepo = componentsRepo;
        this.categoriesRepo = categoriesRepo;
        this.suppliersRepo = suppliersRepo;
        this.inventoryRepo = inventoryRepo;
    }
    async findAll(filter) {
        const pd = this.componentsRepo.createQueryBuilder('component')
            .leftJoinAndSelect('component.category', 'category')
            .leftJoinAndSelect('component.supplier', 'supplier')
            .where('component.is_active = true');
        if (filter?.search) {
            pd.andWhere('(component.nom ILIKE :search OR component.reference ILIKE :search)', { search: `%${filter.search}%` });
        }
        if (filter?.categoryId) {
            pd.andWhere('component.category_id = :catId', { catId: filter.categoryId });
        }
        if (filter?.supplierId) {
            pd.andWhere('component.supplier_id = :supId', { supId: filter.supplierId });
        }
        return pd.orderBy('component.nom', 'ASC').getMany();
    }
    async findOne(id) {
        const c = await this.componentsRepo.findOne({
            where: { id }, relations: { category: true, supplier: true },
        });
        if (!c)
            throw new common_1.NotFoundException(`Composant #${id} introuvable`);
        return c;
    }
    async findByBarcode(barcode) {
        const c = await this.componentsRepo.findOne({
            where: { barcode },
            relations: { category: true, supplier: true },
        });
        if (!c)
            throw new common_1.NotFoundException(`Aucun composant avec le code-barres "${barcode}"`);
        return c;
    }
    async findByReference(ref) {
        const c = await this.componentsRepo.findOne({
            where: { reference: ref }, relations: { category: true, supplier: true },
        });
        if (!c)
            throw new common_1.NotFoundException(`Composant avec référence "${ref}" introuvable`);
        return c;
    }
    async create(dto) {
        const existing = await this.componentsRepo.findOne({ where: { reference: dto.reference } });
        if (existing)
            throw new common_1.ConflictException(`La référence "${dto.reference}" est déjà utilisée`);
        let category = null;
        if (dto.categoryId) {
            category = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
            if (!category)
                throw new common_1.NotFoundException(`Catégorie #${dto.categoryId} introuvable`);
        }
        let supplier = null;
        if (dto.supplierId) {
            supplier = await this.suppliersRepo.findOne({ where: { id: dto.supplierId } });
            if (!supplier)
                throw new common_1.NotFoundException(`Fournisseur #${dto.supplierId} introuvable`);
        }
        let barcode = dto.barcode;
        if (!barcode) {
            let unique = false;
            while (!unique) {
                barcode = generateEAN13();
                const dup = await this.componentsRepo.findOne({ where: { barcode } });
                if (!dup)
                    unique = true;
            }
        }
        return this.componentsRepo.save(this.componentsRepo.create({
            ...dto,
            barcode,
            category: category ?? undefined,
            supplier: supplier ?? undefined,
        }));
    }
    async update(id, dto) {
        const c = await this.findOne(id);
        if (dto.reference && dto.reference !== c.reference) {
            const existing = await this.componentsRepo.findOne({ where: { reference: dto.reference } });
            if (existing)
                throw new common_1.ConflictException(`Référence "${dto.reference}" déjà utilisée`);
        }
        if (dto.categoryId) {
            const category = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
            if (!category)
                throw new common_1.NotFoundException(`Catégorie #${dto.categoryId} introuvable`);
            c.category = category;
        }
        if (dto.supplierId) {
            const supplier = await this.suppliersRepo.findOne({ where: { id: dto.supplierId } });
            if (!supplier)
                throw new common_1.NotFoundException(`Fournisseur #${dto.supplierId} introuvable`);
            c.supplier = supplier;
        }
        Object.assign(c, dto);
        const saved = await this.componentsRepo.save(c);
        if ((dto.prixAchat !== undefined || dto.prixVente !== undefined) && this.productsService) {
            this.productsService.recalcForComponent(id).catch(() => { });
        }
        return saved;
    }
    async deactivate(id) {
        const c = await this.findOne(id);
        c.isActive = false;
        return this.componentsRepo.save(c);
    }
    async updateImageUrl(id, imageUrl) {
        await this.componentsRepo.update(id, { imageUrl });
        return this.findOne(id);
    }
    async getStockSummary(componentId) {
        const component = await this.findOne(componentId);
        const items = await this.inventoryRepo.find({
            where: { component: { id: componentId } },
            relations: { warehouse: true },
        });
        const totalQuantity = items.reduce((s, i) => s + Number(i.quantity), 0);
        return {
            componentId,
            totalQuantity,
            isLowStock: totalQuantity <= component.seuilAlerte,
            threshold: component.seuilAlerte,
            byWarehouse: items.map((i) => ({
                warehouse: i.warehouse,
                quantity: Number(i.quantity),
                reservedQty: Number(i.reservedQty),
                available: Number(i.quantity) - Number(i.reservedQty),
            })),
        };
    }
    async findAllCategories() {
        return this.categoriesRepo.find({ order: { nom: 'ASC' } });
    }
    async createCategory(nom, description) {
        return this.categoriesRepo.save(this.categoriesRepo.create({ nom, description }));
    }
    async findAllSuppliers() {
        return this.suppliersRepo.find({ where: { isActive: true }, order: { nom: 'ASC' } });
    }
    async createSupplier(data) {
        return this.suppliersRepo.save(this.suppliersRepo.create(data));
    }
};
exports.ComponentsService = ComponentsService;
exports.ComponentsService = ComponentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(component_entity_1.Component)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(supplier_entity_1.Supplier)),
    __param(3, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ComponentsService);
//# sourceMappingURL=components.service.js.map