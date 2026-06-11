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
exports.ProductsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const core_1 = require("@nestjs/core");
const product_entity_1 = require("./entities/product.entity");
const bom_line_entity_1 = require("./entities/bom-line.entity");
const production_log_entity_1 = require("./entities/production-log.entity");
const product_inventory_entity_1 = require("./entities/product-inventory.entity");
const component_entity_1 = require("../components/entities/component.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
const warehouse_entity_1 = require("../warehouses/entities/warehouse.entity");
const stock_movement_entity_1 = require("../stock-movements/entities/stock-movement.entity");
const product_category_entity_1 = require("../product-categories/entities/product-category.entity");
const products_service_1 = require("./products.service");
const products_controller_1 = require("./products.controller");
const components_module_1 = require("../components/components.module");
const components_service_1 = require("../components/components.service");
let ProductsModule = class ProductsModule {
    moduleRef;
    productsService;
    constructor(moduleRef, productsService) {
        this.moduleRef = moduleRef;
        this.productsService = productsService;
    }
    onModuleInit() {
        try {
            const compSvc = this.moduleRef.get(components_service_1.ComponentsService, { strict: false });
            compSvc.setProductsService(this.productsService);
        }
        catch {
        }
    }
};
exports.ProductsModule = ProductsModule;
exports.ProductsModule = ProductsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                product_entity_1.Product, bom_line_entity_1.BomLine, production_log_entity_1.ProductionLog, product_inventory_entity_1.ProductInventory,
                component_entity_1.Component, inventory_item_entity_1.InventoryItem, warehouse_entity_1.Warehouse, stock_movement_entity_1.StockMovement, product_category_entity_1.ProductCategory,
            ]),
            (0, common_1.forwardRef)(() => components_module_1.ComponentsModule),
        ],
        controllers: [products_controller_1.ProductsController],
        providers: [products_service_1.ProductsService],
        exports: [products_service_1.ProductsService, typeorm_1.TypeOrmModule],
    }),
    __metadata("design:paramtypes", [core_1.ModuleRef,
        products_service_1.ProductsService])
], ProductsModule);
//# sourceMappingURL=products.module.js.map