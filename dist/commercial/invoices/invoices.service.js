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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const schedule_1 = require("@nestjs/schedule");
const invoice_entity_1 = require("./entities/invoice.entity");
const invoice_line_entity_1 = require("./entities/invoice-line.entity");
const payment_entity_1 = require("./entities/payment.entity");
let InvoicesService = class InvoicesService {
    invoiceRepo;
    lineRepo;
    paymentRepo;
    dataSource;
    constructor(invoiceRepo, lineRepo, paymentRepo, dataSource) {
        this.invoiceRepo = invoiceRepo;
        this.lineRepo = lineRepo;
        this.paymentRepo = paymentRepo;
        this.dataSource = dataSource;
    }
    async generateReference(type) {
        const year = new Date().getFullYear();
        const prefix = type === invoice_entity_1.InvoiceType.CREDIT_NOTE ? 'AV' : 'FAC';
        const pattern = `${prefix}-${year}-%`;
        const count = await this.invoiceRepo.count({
            where: { type, reference: (0, typeorm_2.Like)(pattern) },
        });
        return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
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
        const invoice = await this.invoiceRepo.save(this.invoiceRepo.create({
            reference: await this.generateReference(invoice_entity_1.InvoiceType.INVOICE),
            clientId: dto.clientId,
            quoteId: dto.quoteId ?? null,
            orderId: dto.orderId ?? null,
            type: invoice_entity_1.InvoiceType.INVOICE,
            status: invoice_entity_1.InvoiceStatus.DRAFT,
            dueDate: dto.dueDate ?? null,
            note: dto.note ?? null,
            discount: globalDiscount,
            ...totals,
            createdBy: userId,
        }));
        const lines = dto.lines.map((l, idx) => this.lineRepo.create({
            invoiceId: invoice.id,
            productId: l.productId ?? null,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            tvaRate: l.tvaRate ?? 19,
            discount: l.discount ?? 0,
            totalHt: Math.round(l.quantity * l.unitPrice * (1 - (l.discount ?? 0) / 100) * 1000) / 1000,
            position: l.position ?? idx,
        }));
        await this.lineRepo.save(lines);
        return this.findOne(invoice.id);
    }
    async findAll(query) {
        const qb = this.invoiceRepo
            .createQueryBuilder('i')
            .leftJoinAndSelect('i.client', 'client')
            .leftJoinAndSelect('i.creator', 'creator')
            .orderBy('i.created_at', 'DESC');
        if (query.status)
            qb.andWhere('i.status = :status', { status: query.status });
        if (query.type)
            qb.andWhere('i.type = :type', { type: query.type });
        if (query.clientId)
            qb.andWhere('i.client_id = :clientId', { clientId: query.clientId });
        if (query.dateFrom)
            qb.andWhere('i.created_at >= :from', { from: query.dateFrom });
        if (query.dateTo)
            qb.andWhere('i.created_at <= :to', { to: query.dateTo });
        const total = await qb.getCount();
        const skip = ((query.page ?? 1) - 1) * (query.limit ?? 20);
        qb.skip(skip).take(query.limit ?? 20);
        const data = await qb.getMany();
        return { data, total, page: query.page ?? 1, limit: query.limit ?? 20 };
    }
    async findOne(id) {
        const invoice = await this.invoiceRepo.findOne({
            where: { id },
            relations: {
                client: true,
                creator: true,
                lines: {
                    product: true,
                },
                payments: {
                    creator: true,
                },
                quote: true,
                order: true,
                originalInvoice: true,
            },
        });
        if (!invoice)
            throw new common_1.NotFoundException(`Facture #${id} introuvable`);
        return invoice;
    }
    async markSent(id) {
        const invoice = await this.findOne(id);
        if (invoice.status !== invoice_entity_1.InvoiceStatus.DRAFT) {
            throw new common_1.BadRequestException('Seules les factures en brouillon peuvent être marquées envoyées');
        }
        invoice.status = invoice_entity_1.InvoiceStatus.SENT;
        await this.invoiceRepo.save(invoice);
        return this.findOne(id);
    }
    async addPayment(id, dto, userId) {
        const invoice = await this.findOne(id);
        if (invoice.status === invoice_entity_1.InvoiceStatus.PAID) {
            throw new common_1.BadRequestException('La facture est déjà entièrement payée');
        }
        if (invoice.status === invoice_entity_1.InvoiceStatus.CANCELLED) {
            throw new common_1.BadRequestException('Impossible de payer une facture annulée');
        }
        const restant = Number(invoice.totalTtc) - Number(invoice.amountPaid);
        if (dto.amount > restant + 0.001) {
            throw new common_1.BadRequestException(`Montant dépasse le restant dû : ${restant.toFixed(3)} TND`);
        }
        return this.dataSource.transaction(async (manager) => {
            await manager.save(manager.create(payment_entity_1.Payment, {
                invoiceId: id,
                amount: dto.amount,
                method: dto.method,
                reference: dto.reference ?? null,
                paidAt: dto.paidAt ?? new Date().toISOString().split('T')[0],
                note: dto.note ?? null,
                createdBy: userId,
            }));
            const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
            const newStatus = newAmountPaid >= Number(invoice.totalTtc) - 0.001
                ? invoice_entity_1.InvoiceStatus.PAID
                : invoice_entity_1.InvoiceStatus.PARTIAL;
            await manager.update(invoice_entity_1.Invoice, id, {
                amountPaid: Math.round(newAmountPaid * 1000) / 1000,
                status: newStatus,
            });
            return this.findOne(id);
        });
    }
    async createCreditNote(id, userId, reason) {
        const invoice = await this.findOne(id);
        if (invoice.type === invoice_entity_1.InvoiceType.CREDIT_NOTE) {
            throw new common_1.BadRequestException('Impossible de générer un avoir sur un avoir');
        }
        if (invoice.status === invoice_entity_1.InvoiceStatus.CANCELLED) {
            throw new common_1.BadRequestException('Impossible de générer un avoir sur une facture annulée');
        }
        return this.dataSource.transaction(async (manager) => {
            const creditNote = await manager.save(manager.create(invoice_entity_1.Invoice, {
                reference: await this.generateReference(invoice_entity_1.InvoiceType.CREDIT_NOTE),
                clientId: invoice.clientId,
                quoteId: null,
                orderId: null,
                originalInvoiceId: invoice.id,
                type: invoice_entity_1.InvoiceType.CREDIT_NOTE,
                status: invoice_entity_1.InvoiceStatus.DRAFT,
                discount: invoice.discount,
                totalHt: invoice.totalHt,
                totalTva: invoice.totalTva,
                totalTtc: invoice.totalTtc,
                note: reason
                    ? `Avoir sur ${invoice.reference} — ${reason}`
                    : `Avoir sur ${invoice.reference}`,
                createdBy: userId,
            }));
            const creditLines = invoice.lines.map((l) => manager.create(invoice_line_entity_1.InvoiceLine, {
                invoiceId: creditNote.id,
                productId: l.productId,
                description: l.description,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                tvaRate: l.tvaRate,
                discount: l.discount,
                totalHt: l.totalHt,
                position: l.position,
            }));
            await manager.save(creditLines);
            return creditNote;
        });
    }
    async cancel(id) {
        const invoice = await this.findOne(id);
        if (invoice.status === invoice_entity_1.InvoiceStatus.PAID) {
            throw new common_1.BadRequestException('Impossible d\'annuler une facture PAID — générez un avoir');
        }
        if (invoice.status === invoice_entity_1.InvoiceStatus.CANCELLED) {
            throw new common_1.BadRequestException('Facture déjà annulée');
        }
        invoice.status = invoice_entity_1.InvoiceStatus.CANCELLED;
        await this.invoiceRepo.save(invoice);
        return this.findOne(id);
    }
    async checkOverdue() {
        const today = new Date().toISOString().split('T')[0];
        await this.invoiceRepo
            .createQueryBuilder()
            .update(invoice_entity_1.Invoice)
            .set({ status: invoice_entity_1.InvoiceStatus.OVERDUE })
            .where('status IN (:...statuses)', {
            statuses: [invoice_entity_1.InvoiceStatus.SENT, invoice_entity_1.InvoiceStatus.PARTIAL],
        })
            .andWhere('due_date < :today', { today })
            .execute();
    }
    async getStats() {
        return this.invoiceRepo
            .createQueryBuilder('i')
            .select('i.type', 'type')
            .addSelect('i.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .addSelect('SUM(i.total_ttc)', 'totalTtc')
            .addSelect('SUM(i.total_ttc - i.amount_paid)', 'unpaid')
            .groupBy('i.type, i.status')
            .getRawMany();
    }
};
exports.InvoicesService = InvoicesService;
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InvoicesService.prototype, "checkOverdue", null);
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(1, (0, typeorm_1.InjectRepository)(invoice_line_entity_1.InvoiceLine)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map