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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryNotesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const delivery_note_entity_1 = require("./entities/delivery-note.entity");
const delivery_note_line_entity_1 = require("./entities/delivery-note-line.entity");
let DeliveryNotesService = class DeliveryNotesService {
    repo;
    lineRepo;
    constructor(repo, lineRepo) {
        this.repo = repo;
        this.lineRepo = lineRepo;
    }
    async generateReference() {
        const year = new Date().getFullYear();
        const pattern = `BL-${year}-%`;
        const count = await this.repo.count({ where: { reference: (0, typeorm_2.Like)(pattern) } });
        return `BL-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    async create(dto, userId) {
        const dn = await this.repo.save(this.repo.create({
            reference: await this.generateReference(),
            clientId: dto.clientId,
            orderId: dto.orderId ?? null,
            invoiceId: dto.invoiceId ?? null,
            deliveryAddress: dto.deliveryAddress ?? null,
            note: dto.note ?? null,
            status: delivery_note_entity_1.DeliveryStatus.PENDING,
            createdBy: userId,
        }));
        const lines = dto.lines.map((l, idx) => this.lineRepo.create({
            deliveryNoteId: dn.id,
            productId: l.productId,
            quantityOrdered: l.quantityOrdered,
            quantityDelivered: l.quantityDelivered,
            position: l.position ?? idx,
        }));
        await this.lineRepo.save(lines);
        return this.findOne(dn.id);
    }
    async findAll(params) {
        const qb = this.repo
            .createQueryBuilder('dn')
            .leftJoinAndSelect('dn.client', 'client')
            .leftJoinAndSelect('dn.creator', 'creator')
            .leftJoinAndSelect('dn.lines', 'lines')
            .leftJoinAndSelect('lines.product', 'product')
            .orderBy('dn.created_at', 'DESC');
        if (params?.clientId) {
            qb.andWhere('dn.client_id = :clientId', { clientId: params.clientId });
        }
        if (params?.status) {
            qb.andWhere('dn.status = :status', { status: params.status });
        }
        return qb.getMany();
    }
    async findOne(id) {
        const dn = await this.repo.findOne({
            where: { id },
            relations: {
                client: true,
                creator: true,
                lines: {
                    product: true,
                },
                order: true,
                invoice: true,
            },
        });
        if (!dn)
            throw new common_1.NotFoundException(`Bon de livraison #${id} introuvable`);
        return dn;
    }
    async markDelivered(id, dto) {
        const dn = await this.findOne(id);
        if (dn.status === delivery_note_entity_1.DeliveryStatus.SIGNED) {
            throw new common_1.BadRequestException('Bon de livraison déjà signé');
        }
        dn.deliveredAt = new Date();
        dn.note = dto.note ?? dn.note;
        if (dto.signatureUrl) {
            dn.status = delivery_note_entity_1.DeliveryStatus.SIGNED;
            dn.signatureUrl = dto.signatureUrl;
        }
        else {
            dn.status = delivery_note_entity_1.DeliveryStatus.DELIVERED;
        }
        await this.repo.save(dn);
        return this.findOne(id);
    }
    async remove(id) {
        const dn = await this.findOne(id);
        if (dn.status !== delivery_note_entity_1.DeliveryStatus.PENDING) {
            throw new common_1.BadRequestException('Seuls les bons de livraison en attente peuvent être supprimés');
        }
        await this.repo.remove(dn);
    }
};
exports.DeliveryNotesService = DeliveryNotesService;
exports.DeliveryNotesService = DeliveryNotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(delivery_note_entity_1.DeliveryNote)),
    __param(1, (0, typeorm_1.InjectRepository)(delivery_note_line_entity_1.DeliveryNoteLine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], DeliveryNotesService);
//# sourceMappingURL=delivery-notes.service.js.map