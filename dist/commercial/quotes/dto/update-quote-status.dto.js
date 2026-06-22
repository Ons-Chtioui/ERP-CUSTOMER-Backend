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
exports.UpdateQuoteStatusDto = void 0;
const class_validator_1 = require("class-validator");
const quote_entity_1 = require("../entities/quote.entity");
class UpdateQuoteStatusDto {
    status;
    comment;
}
exports.UpdateQuoteStatusDto = UpdateQuoteStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(quote_entity_1.QuoteStatus),
    __metadata("design:type", String)
], UpdateQuoteStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateQuoteStatusDto.prototype, "comment", void 0);
//# sourceMappingURL=update-quote-status.dto.js.map