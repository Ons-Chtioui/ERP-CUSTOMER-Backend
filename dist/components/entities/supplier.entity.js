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
exports.Supplier = void 0;
const typeorm_1 = require("typeorm");
const component_entity_1 = require("./component.entity");
let Supplier = class Supplier {
    id;
    nom;
    code;
    email;
    telephone;
    adresse;
    pays;
    isActive;
    components;
    createdAt;
    updatedAt;
};
exports.Supplier = Supplier;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], Supplier.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], Supplier.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 191, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 30, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "telephone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "adresse", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 60, nullable: true }),
    __metadata("design:type", String)
], Supplier.prototype, "pays", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], Supplier.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => component_entity_1.Component, (component) => component.supplier),
    __metadata("design:type", Array)
], Supplier.prototype, "components", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Supplier.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Supplier.prototype, "updatedAt", void 0);
exports.Supplier = Supplier = __decorate([
    (0, typeorm_1.Entity)('suppliers')
], Supplier);
//# sourceMappingURL=supplier.entity.js.map