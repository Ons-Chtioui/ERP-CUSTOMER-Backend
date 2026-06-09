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
exports.InventorySession = exports.SessionStatus = void 0;
const typeorm_1 = require("typeorm");
const warehouse_entity_1 = require("../../warehouses/entities/warehouse.entity");
const user_entity_1 = require("../../users/entities/user.entity");
const inventory_line_entity_1 = require("./inventory-line.entity");
var SessionStatus;
(function (SessionStatus) {
    SessionStatus["DRAFT"] = "draft";
    SessionStatus["IN_PROGRESS"] = "in_progress";
    SessionStatus["CLOSED"] = "closed";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
let InventorySession = class InventorySession {
    id;
    warehouse;
    user;
    nom;
    status;
    startedAt;
    closedAt;
    notes;
    lines;
    createdAt;
};
exports.InventorySession = InventorySession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], InventorySession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => warehouse_entity_1.Warehouse),
    (0, typeorm_1.JoinColumn)({ name: 'warehouse_id' }),
    __metadata("design:type", warehouse_entity_1.Warehouse)
], InventorySession.prototype, "warehouse", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], InventorySession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], InventorySession.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: SessionStatus, default: SessionStatus.DRAFT }),
    __metadata("design:type", String)
], InventorySession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'started_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventorySession.prototype, "startedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'closed_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Object)
], InventorySession.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], InventorySession.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => inventory_line_entity_1.InventoryLine, (l) => l.session, { cascade: true }),
    __metadata("design:type", Array)
], InventorySession.prototype, "lines", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], InventorySession.prototype, "createdAt", void 0);
exports.InventorySession = InventorySession = __decorate([
    (0, typeorm_1.Entity)('inventory_sessions')
], InventorySession);
//# sourceMappingURL=inventory-session.entity.js.map