"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockAlertsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const stock_alert_entity_1 = require("./entities/stock-alert.entity");
const component_entity_1 = require("../components/entities/component.entity");
const stock_alerts_service_1 = require("./stock-alerts.service");
const stock_alerts_controller_1 = require("./stock-alerts.controller");
let StockAlertsModule = class StockAlertsModule {
};
exports.StockAlertsModule = StockAlertsModule;
exports.StockAlertsModule = StockAlertsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([stock_alert_entity_1.StockAlert, component_entity_1.Component])],
        controllers: [stock_alerts_controller_1.StockAlertsController],
        providers: [stock_alerts_service_1.StockAlertsService],
        exports: [stock_alerts_service_1.StockAlertsService],
    })
], StockAlertsModule);
//# sourceMappingURL=stock-alerts.module.js.map