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
exports.Component = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
const supplier_entity_1 = require("./supplier.entity");
const inventory_item_entity_1 = require("./inventory-item.entity");
const stock_movement_entity_1 = require("../../stock-movements/entities/stock-movement.entity");
let Component = class Component {
    id;
    nom;
    description;
    reference;
    unite;
    prixAchat;
    seuilAlerte;
    barcode;
    imageUrl;
    isActive;
    category;
    supplier;
    inventoryItems;
    movements;
    createdAt;
    updatedAt;
};
exports.Component = Component;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Component.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], Component.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Component.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 80, unique: true }),
    __metadata("design:type", String)
], Component.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: 'unité' }),
    __metadata("design:type", String)
], Component.prototype, "unite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'prix_achat', type: 'decimal', precision: 12, scale: 4, default: 0 }),
    __metadata("design:type", Number)
], Component.prototype, "prixAchat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'seuil_alerte', default: 0 }),
    __metadata("design:type", Number)
], Component.prototype, "seuilAlerte", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Component.prototype, "barcode", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', length: 255, nullable: true }),
    __metadata("design:type", String)
], Component.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Component.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, (c) => c.components, { nullable: true, eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], Component.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => supplier_entity_1.Supplier, (s) => s.components, { nullable: true, eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'supplier_id' }),
    __metadata("design:type", supplier_entity_1.Supplier)
], Component.prototype, "supplier", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_item_entity_1.InventoryItem, (i) => i.component),
    __metadata("design:type", Array)
], Component.prototype, "inventoryItems", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => stock_movement_entity_1.StockMovement, (m) => m.component),
    __metadata("design:type", Array)
], Component.prototype, "movements", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Component.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Component.prototype, "updatedAt", void 0);
exports.Component = Component = __decorate([
    (0, typeorm_1.Entity)('components')
], Component);
//# sourceMappingURL=component.entity.js.map