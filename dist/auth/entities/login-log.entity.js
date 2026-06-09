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
exports.LoginLog = exports.LoginStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
var LoginStatus;
(function (LoginStatus) {
    LoginStatus["SUCCESS"] = "success";
    LoginStatus["FAILED"] = "failed";
    LoginStatus["BLOCKED"] = "blocked";
})(LoginStatus || (exports.LoginStatus = LoginStatus = {}));
let LoginLog = class LoginLog {
    id;
    user;
    email;
    ipAddress;
    userAgent;
    status;
    loggedAt;
};
exports.LoginLog = LoginLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('increment'),
    __metadata("design:type", Number)
], LoginLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], LoginLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 191 }),
    __metadata("design:type", String)
], LoginLog.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ip_address', length: 45 }),
    __metadata("design:type", String)
], LoginLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_agent', type: 'text', nullable: true }),
    __metadata("design:type", String)
], LoginLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: LoginStatus }),
    __metadata("design:type", String)
], LoginLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'logged_at' }),
    __metadata("design:type", Date)
], LoginLog.prototype, "loggedAt", void 0);
exports.LoginLog = LoginLog = __decorate([
    (0, typeorm_1.Entity)('login_logs')
], LoginLog);
//# sourceMappingURL=login-log.entity.js.map