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
exports.StockAlert = exports.AlertStatus = void 0;
const typeorm_1 = require("typeorm");
const warehouse_entity_1 = require("../../warehouses/entities/warehouse.entity");
const component_entity_1 = require("../../components/entities/component.entity");
var AlertStatus;
(function (AlertStatus) {
    AlertStatus["ACTIVE"] = "active";
    AlertStatus["RESOLVED"] = "resolved";
})(AlertStatus || (exports.AlertStatus = AlertStatus = {}));
let StockAlert = class StockAlert {
    id;
    warehouse;
    component;
    quantityAtAlert;
    threshold;
    status;
    resolvedAt;
    createdAt;
};
exports.StockAlert = StockAlert;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], StockAlert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], StockAlert.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => component_entity_1.Component),
    (0, typeorm_1.JoinColumn)({ name: 'component_id' }),
    __metadata("design:type", component_entity_1.Component)
], StockAlert.prototype, "component", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'quantity_at_alert', type: 'int' }),
    __metadata("design:type", Number)
], StockAlert.prototype, "quantityAtAlert", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StockAlert.prototype, "threshold", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE }),
    __metadata("design:type", String)
], StockAlert.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'resolved_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], StockAlert.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], StockAlert.prototype, "createdAt", void 0);
exports.StockAlert = StockAlert = __decorate([
    (0, typeorm_1.Entity)('stock_alerts')
], StockAlert);
//# sourceMappingURL=stock-alert.entity.js.map