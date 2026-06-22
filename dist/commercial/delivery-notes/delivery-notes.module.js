"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryNotesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const delivery_notes_service_1 = require("./delivery-notes.service");
const delivery_notes_controller_1 = require("./delivery-notes.controller");
const delivery_note_entity_1 = require("./entities/delivery-note.entity");
const delivery_note_line_entity_1 = require("./entities/delivery-note-line.entity");
let DeliveryNotesModule = class DeliveryNotesModule {
};
exports.DeliveryNotesModule = DeliveryNotesModule;
exports.DeliveryNotesModule = DeliveryNotesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([delivery_note_entity_1.DeliveryNote, delivery_note_line_entity_1.DeliveryNoteLine]),
        ],
        providers: [delivery_notes_service_1.DeliveryNotesService],
        controllers: [delivery_notes_controller_1.DeliveryNotesController],
        exports: [delivery_notes_service_1.DeliveryNotesService],
    })
], DeliveryNotesModule);
//# sourceMappingURL=delivery-notes.module.js.map