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
exports.QuotesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const typeorm_2 = require("typeorm");
const quote_entity_1 = require("./entities/quote.entity");
const quote_line_entity_1 = require("./entities/quote-line.entity");
const invoice_entity_1 = require("../invoices/entities/invoice.entity");
const invoice_line_entity_1 = require("../invoices/entities/invoice-line.entity");
const STATUS_TRANSITIONS = {
    [quote_entity_1.QuoteStatus.DRAFT]: [quote_entity_1.QuoteStatus.SENT, quote_entity_1.QuoteStatus.REFUSED],
    [quote_entity_1.QuoteStatus.SENT]: [quote_entity_1.QuoteStatus.ACCEPTED, quote_entity_1.QuoteStatus.REFUSED, quote_entity_1.QuoteStatus.EXPIRED],
    [quote_entity_1.QuoteStatus.ACCEPTED]: [],
    [quote_entity_1.QuoteStatus.REFUSED]: [],
    [quote_entity_1.QuoteStatus.EXPIRED]: [],
    [quote_entity_1.QuoteStatus.CONVERTED]: [],
};
let QuotesService = class QuotesService {
    quoteRepo;
    lineRepo;
    invoiceRepo;
    invoiceLineRepo;
    dataSource;
    constructor(quoteRepo, lineRepo, invoiceRepo, invoiceLineRepo, dataSource) {
        this.quoteRepo = quoteRepo;
        this.lineRepo = lineRepo;
        this.invoiceRepo = invoiceRepo;
        this.invoiceLineRepo = invoiceLineRepo;
        this.dataSource = dataSource;
    }
    async generateReference() {
        const year = new Date().getFullYear();
        const pattern = `DEV-${year}-%`;
        const count = await this.quoteRepo.count({ where: { reference: (0, typeorm_2.Like)(pattern) } });
        return `DEV-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    computeTotals(lines, globalDiscount) {
        let totalHt = 0;
        let totalTva = 0;
        for (const l of lines) {
            const disc = l.discount ?? 0;
            const tva = l.tvaRate ?? 19;
            const lineHt = l.quantity * l.unitPrice * (1 - disc / 100);
            totalHt += lineHt;
            totalTva += lineHt * (tva / 100);
        }
        const factor = 1 - globalDiscount / 100;
        totalHt = Math.round(totalHt * factor * 1000) / 1000;
        totalTva = Math.round(totalTva * factor * 1000) / 1000;
        return { totalHt, totalTva, totalTtc: totalHt + totalTva };
    }
    async create(dto, userId) {
        const globalDiscount = dto.discount ?? 0;
        const totals = this.computeTotals(dto.lines, globalDiscount);
        const quote = await this.quoteRepo.save(this.quoteRepo.create({
            reference: await this.generateReference(),
            clientId: dto.clientId,
            validUntil: dto.validUntil,
            note: dto.note ?? null,
            discount: globalDiscount,
            ...totals,
            createdBy: userId,
            status: quote_entity_1.QuoteStatus.DRAFT,
        }));
        const lines = dto.lines.map((l, idx) => this.lineRepo.create({
            quoteId: quote.id,
            productId: l.productId,
            description: l.description ?? null,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            tvaRate: l.tvaRate ?? 19,
            discount: l.discount ?? 0,
            totalHt: Math.round(l.quantity * l.unitPrice * (1 - (l.discount ?? 0) / 100) * 1000) / 1000,
            position: l.position ?? idx,
        }));
        await this.lineRepo.save(lines);
        return this.findOne(quote.id);
    }
    async findAll(query) {
        const qb = this.quoteRepo
            .createQueryBuilder('q')
            .leftJoinAndSelect('q.client', 'client')
            .leftJoinAndSelect('q.creator', 'creator')
            .orderBy('q.created_at', 'DESC');
        if (query.status)
            qb.andWhere('q.status = :status', { status: query.status });
        if (query.clientId)
            qb.andWhere('q.client_id = :clientId', { clientId: query.clientId });
        if (query.dateFrom)
            qb.andWhere('q.created_at >= :from', { from: query.dateFrom });
        if (query.dateTo)
            qb.andWhere('q.created_at <= :to', { to: query.dateTo });
        const total = await qb.getCount();
        const skip = ((query.page ?? 1) - 1) * (query.limit ?? 20);
        qb.skip(skip).take(query.limit ?? 20);
        const data = await qb.getMany();
        return { data, total, page: query.page ?? 1, limit: query.limit ?? 20 };
    }
    async findOne(id) {
        const quote = await this.quoteRepo.findOne({
            where: { id },
            relations: {
                client: true,
                creator: true,
                lines: { product: true },
            },
        });
        if (!quote)
            throw new common_1.NotFoundException(`Devis #${id} introuvable`);
        return quote;
    }
    async updateStatus(id, dto) {
        const quote = await this.findOne(id);
        const allowed = STATUS_TRANSITIONS[quote.status];
        if (dto.status === quote_entity_1.QuoteStatus.CONVERTED) {
            throw new common_1.BadRequestException('Utilisez POST /quotes/:id/convert pour convertir un devis en facture');
        }
        if (!allowed.includes(dto.status)) {
            throw new common_1.BadRequestException(`Transition ${quote.status} → ${dto.status} non autorisée`);
        }
        quote.status = dto.status;
        if (dto.comment) {
            quote.note = quote.note
                ? `${quote.note}\n[${dto.status}] ${dto.comment}`
                : `[${dto.status}] ${dto.comment}`;
        }
        await this.quoteRepo.save(quote);
        return this.findOne(id);
    }
    async convertToInvoice(id, userId) {
        const quote = await this.findOne(id);
        if (quote.status === quote_entity_1.QuoteStatus.CONVERTED) {
            throw new common_1.BadRequestException('Devis déjà converti en facture');
        }
        if ([quote_entity_1.QuoteStatus.REFUSED, quote_entity_1.QuoteStatus.EXPIRED].includes(quote.status)) {
            throw new common_1.BadRequestException(`Impossible de convertir un devis ${quote.status}`);
        }
        if (quote.status === quote_entity_1.QuoteStatus.DRAFT) {
            throw new common_1.BadRequestException('Le devis doit être au moins SENT ou ACCEPTED pour être converti');
        }
        return this.dataSource.transaction(async (manager) => {
            const year = new Date().getFullYear();
            const pattern = `FAC-${year}-%`;
            const invCount = await manager.count(invoice_entity_1.Invoice, {
                where: { reference: (0, typeorm_2.Like)(pattern) },
            });
            const ref = `FAC-${year}-${String(invCount + 1).padStart(4, '0')}`;
            const invoice = await manager.save(manager.create(invoice_entity_1.Invoice, {
                reference: ref,
                clientId: quote.clientId,
                quoteId: quote.id,
                type: invoice_entity_1.InvoiceType.INVOICE,
                status: invoice_entity_1.InvoiceStatus.DRAFT,
                discount: quote.discount,
                totalHt: quote.totalHt,
                totalTva: quote.totalTva,
                totalTtc: quote.totalTtc,
                createdBy: userId,
            }));
            const invoiceLines = quote.lines.map((l) => manager.create(invoice_line_entity_1.InvoiceLine, {
                invoiceId: invoice.id,
                productId: l.productId,
                description: l.description ?? l.product?.nom ?? '',
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                tvaRate: l.tvaRate,
                discount: l.discount,
                totalHt: l.totalHt,
                position: l.position,
            }));
            await manager.save(invoiceLines);
            await manager.update(quote_entity_1.Quote, id, {
                status: quote_entity_1.QuoteStatus.CONVERTED,
                convertedTo: invoice.id,
                convertedAt: new Date(),
            });
            return invoice;
        });
    }
    async remove(id) {
        const quote = await this.findOne(id);
        if (quote.status !== quote_entity_1.QuoteStatus.DRAFT) {
            throw new common_1.BadRequestException('Seuls les devis en brouillon peuvent être supprimés');
        }
        await this.quoteRepo.remove(quote);
    }
    async markExpiredQuotes() {
        const today = new Date().toISOString().split('T')[0];
        await this.quoteRepo
            .createQueryBuilder()
            .update(quote_entity_1.Quote)
            .set({ status: quote_entity_1.QuoteStatus.EXPIRED })
            .where('status IN (:...statuses)', {
            statuses: [quote_entity_1.QuoteStatus.DRAFT, quote_entity_1.QuoteStatus.SENT],
        })
            .andWhere('valid_until < :today', { today })
            .execute();
    }
};
exports.QuotesService = QuotesService;
__decorate([
    (0, schedule_1.Cron)('0 7 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], QuotesService.prototype, "markExpiredQuotes", null);
exports.QuotesService = QuotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quote_entity_1.Quote)),
    __param(1, (0, typeorm_1.InjectRepository)(quote_line_entity_1.QuoteLine)),
    __param(2, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(3, (0, typeorm_1.InjectRepository)(invoice_line_entity_1.InvoiceLine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], QuotesService);
//# sourceMappingURL=quotes.service.js.map