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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const typeorm_1 = require("typeorm");
const product_category_entity_1 = require("../../product-categories/entities/product-category.entity");
const bom_line_entity_1 = require("./bom-line.entity");
const production_log_entity_1 = require("./production-log.entity");
const product_inventory_entity_1 = require("./product-inventory.entity");
let Product = class Product {
    id;
    nom;
    reference;
    description;
    unite;
    prixVente;
    prixVenteAuto;
    coutRevient;
    coutMO;
    seuilAlerte;
    imageUrl;
    isActive;
    parent;
    variants;
    category;
    bomLines;
    productionLogs;
    inventory;
    createdAt;
    updatedAt;
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], Product.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80, unique: true }),
    __metadata("design:type", String)
], Product.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'unité' }),
    __metadata("design:type", String)
], Product.prototype, "unite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'prix_vente', type: 'decimal', precision: 12, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "prixVente", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'prix_vente_auto', type: 'decimal', precision: 12, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "prixVenteAuto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cout_revient', type: 'decimal', precision: 12, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "coutRevient", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cout_mo', type: 'decimal', precision: 12, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "coutMO", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seuil_alerte', default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "seuilAlerte", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Product.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Product, (p) => p.variants, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'parent_id' }),
    __metadata("design:type", Object)
], Product.prototype, "parent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Product, (p) => p.parent),
    __metadata("design:type", Array)
], Product.prototype, "variants", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_category_entity_1.ProductCategory, (c) => c.products, { nullable: true, eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", Object)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => bom_line_entity_1.BomLine, (b) => b.product, { cascade: true }),
    __metadata("design:type", Array)
], Product.prototype, "bomLines", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => production_log_entity_1.ProductionLog, (l) => l.product),
    __metadata("design:type", Array)
], Product.prototype, "productionLogs", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_inventory_entity_1.ProductInventory, (i) => i.product),
    __metadata("design:type", Array)
], Product.prototype, "inventory", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Product.prototype, "updatedAt", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products')
], Product);
//# sourceMappingURL=product.entity.js.map