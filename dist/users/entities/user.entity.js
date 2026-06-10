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
exports.User = void 0;
const typeorm_1 = require("typeorm");
const permission_entity_1 = require("../../permissions/entities/permission.entity");
let User = class User {
    id;
    companyId;
    nom;
    prenom;
    email;
    password;
    isActive;
    failedAttempts;
    lockedUntil;
    emailVerifiedAt;
    lastLoginAt;
    passwordChangedAt;
    role;
    permissions;
    createdAt;
    updatedAt;
    deletedAt;
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'company_id', nullable: true }),
    __metadata("design:type", Number)
], User.prototype, "companyId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], User.prototype, "nom", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], User.prototype, "prenom", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 191 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'failed_attempts', default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "failedAttempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'locked_until', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], User.prototype, "lockedUntil", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'email_verified_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], User.prototype, "emailVerifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_login_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], User.prototype, "lastLoginAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'password_changed_at', nullable: true, type: 'timestamp' }),
    __metadata("design:type", Object)
], User.prototype, "passwordChangedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Role', (role) => role.users, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'role_id' }),
    __metadata("design:type", Function)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.ManyToMany)(() => permission_entity_1.Permission, { eager: true }),
    (0, typeorm_1.JoinTable)({
        name: 'user_permissions',
        joinColumn: { name: 'user_id' },
        inverseJoinColumn: { name: 'permission_id' },
    }),
    __metadata("design:type", Array)
], User.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.DeleteDateColumn)({ name: 'deleted_at' }),
    __metadata("design:type", Date)
], User.prototype, "deletedAt", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)('users')
], User);
//# sourceMappingURL=user.entity.js.map