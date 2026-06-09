"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentsModule = void 0;
const common_1 = require("@nestjs/common");
const components_service_1 = require("./components.service");
const components_controller_1 = require("./components.controller");
const typeorm_1 = require("@nestjs/typeorm");
const component_entity_1 = require("./entities/component.entity");
const inventory_item_entity_1 = require("./entities/inventory-item.entity");
const category_entity_1 = require("./entities/category.entity");
const supplier_entity_1 = require("./entities/supplier.entity");
let ComponentsModule = class ComponentsModule {
};
exports.ComponentsModule = ComponentsModule;
exports.ComponentsModule = ComponentsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([component_entity_1.Component, category_entity_1.Category, supplier_entity_1.Supplier, inventory_item_entity_1.InventoryItem])],
        providers: [components_service_1.ComponentsService],
        controllers: [components_controller_1.ComponentsController],
        exports: [components_service_1.ComponentsService, typeorm_1.TypeOrmModule]
    })
], ComponentsModule);
//# sourceMappingURL=components.module.js.map