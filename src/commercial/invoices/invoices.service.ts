// src/commercial/invoices/invoices.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Like } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Invoice, InvoiceStatus, InvoiceType } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { Payment } from './entities/payment.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { DocumentsService } from '../../documents/documents.service';

interface Totals {
  totalHt: number;
  totalTva: number;
  totalTtc: number;
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)     private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceLine) private lineRepo:    Repository<InvoiceLine>,
    @InjectRepository(Payment)     private paymentRepo: Repository<Payment>,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
  ) {}

  // ── Génération référence ──────────────────────────────────────
  private async generateReference(type: InvoiceType): Promise<string> {
    const year   = new Date().getFullYear();
    const prefix = type === InvoiceType.CREDIT_NOTE ? 'AV' : 'FAC';
    const pattern = `${prefix}-${year}-%`;
    const count  = await this.invoiceRepo.count({
      where: { type, reference: Like(pattern) },
    });
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // ── Calcul totaux ─────────────────────────────────────────────
  private computeTotals(
    lines: Array<{ quantity: number; unitPrice: number; discount?: number; tvaRate?: number }>,
    globalDiscount: number,
  ): Totals {
    let totalHt  = 0;
    let totalTva = 0;

    for (const l of lines) {
      const disc   = l.discount ?? 0;
      const tva    = l.tvaRate  ?? 19;
      const lineHt = l.quantity * l.unitPrice * (1 - disc / 100);
      totalHt  += lineHt;
      totalTva += lineHt * (tva / 100);
    }

    const factor = 1 - globalDiscount / 100;
    totalHt  = Math.round(totalHt  * factor * 1000) / 1000;
    totalTva = Math.round(totalTva * factor * 1000) / 1000;

    return { totalHt, totalTva, totalTtc: totalHt + totalTva };
  }

  // ── CREATE (manuelle) ─────────────────────────────────────────
  async create(dto: CreateInvoiceDto, userId: number): Promise<Invoice> {
    const globalDiscount = dto.discount ?? 0;
    const totals         = this.computeTotals(dto.lines, globalDiscount);

    const invoice = await this.invoiceRepo.save(
      this.invoiceRepo.create({
        reference: await this.generateReference(InvoiceType.INVOICE),
        clientId:  dto.clientId,
        quoteId:   dto.quoteId   ?? null,
        orderId:   dto.orderId   ?? null,
        type:      InvoiceType.INVOICE,
        status:    InvoiceStatus.DRAFT,
        dueDate:   dto.dueDate   ?? null,
        note:      dto.note      ?? null,
        discount:  globalDiscount,
        ...totals,
        createdBy: userId,
      }),
    );

    const lines = dto.lines.map((l, idx) =>
      this.lineRepo.create({
        invoiceId:   invoice.id,
        productId:   l.productId ?? null,
        description: l.description,
        quantity:    l.quantity,
        unitPrice:   l.unitPrice,
        tvaRate:     l.tvaRate  ?? 19,
        discount:    l.discount ?? 0,
        totalHt:     Math.round(
          l.quantity * l.unitPrice * (1 - (l.discount ?? 0) / 100) * 1000,
        ) / 1000,
        position:    l.position ?? idx,
      }),
    );
    await this.lineRepo.save(lines);

    return this.findOne(invoice.id);
  }

  // ── FIND ALL ──────────────────────────────────────────────────
  async findAll(query: QueryInvoicesDto) {
    const qb = this.invoiceRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.client',  'client')
      .leftJoinAndSelect('i.creator', 'creator')
      .orderBy('i.created_at', 'DESC');

    if (query.status)   qb.andWhere('i.status = :status',     { status:   query.status });
    if (query.type)     qb.andWhere('i.type = :type',         { type:     query.type });
    if (query.clientId) qb.andWhere('i.client_id = :clientId',{ clientId: query.clientId });
    if (query.dateFrom) qb.andWhere('i.created_at >= :from',  { from:     query.dateFrom });
    if (query.dateTo)   qb.andWhere('i.created_at <= :to',    { to:       query.dateTo });

    const total = await qb.getCount();
    const skip  = ((query.page ?? 1) - 1) * (query.limit ?? 20);
    qb.skip(skip).take(query.limit ?? 20);

    const data = await qb.getMany();
    return { data, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  // ── FIND ONE ──────────────────────────────────────────────────
  async findOne(id: number): Promise<Invoice> {
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
    if (!invoice) throw new NotFoundException(`Facture #${id} introuvable`);
    return invoice;
  }

  // ── MARK SENT ─────────────────────────────────────────────────
  async markSent(id: number): Promise<Invoice> {
    const invoice = await this.findOne(id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        'Seules les factures en brouillon peuvent être marquées envoyées',
      );
    }
    invoice.status = InvoiceStatus.SENT;
    await this.invoiceRepo.save(invoice);

    try {
      await this.documentsService.sendInvoiceEmail(id);
    } catch {
      // Email optionnel si client sans email ou SMTP indisponible
    }

    return this.findOne(id);
  }

  // ── ADD PAYMENT ───────────────────────────────────────────────
  async addPayment(id: number, dto: AddPaymentDto, userId: number): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('La facture est déjà entièrement payée');
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Impossible de payer une facture annulée');
    }

    const restant = Number(invoice.totalTtc) - Number(invoice.amountPaid);
    if (dto.amount > restant + 0.001) {
      throw new BadRequestException(
        `Montant dépasse le restant dû : ${restant.toFixed(3)} TND`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Enregistrer le paiement
      await manager.save(
        manager.create(Payment, {
          invoiceId: id,
          amount:    dto.amount,
          method:    dto.method,
          reference: dto.reference ?? null,
          paidAt:    dto.paidAt ?? new Date().toISOString().split('T')[0],
          note:      dto.note ?? null,
          createdBy: userId,
        }),
      );

      // 2. Mettre à jour amountPaid + statut
      const newAmountPaid = Number(invoice.amountPaid) + dto.amount;
      const newStatus     =
        newAmountPaid >= Number(invoice.totalTtc) - 0.001
          ? InvoiceStatus.PAID
          : InvoiceStatus.PARTIAL;

      await manager.update(Invoice, id, {
        amountPaid: Math.round(newAmountPaid * 1000) / 1000,
        status:     newStatus,
      });

      return this.findOne(id);
    });
  }

  // ── CREATE CREDIT NOTE (Avoir) ────────────────────────────────
  async createCreditNote(id: number, userId: number, reason?: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Règle : pas d'avoir sur un avoir (évite les boucles)
    if (invoice.type === InvoiceType.CREDIT_NOTE) {
      throw new BadRequestException(
        'Impossible de générer un avoir sur un avoir',
      );
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException(
        'Impossible de générer un avoir sur une facture annulée',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Créer l'avoir
      const creditNote = await manager.save(
        manager.create(Invoice, {
          reference:         await this.generateReference(InvoiceType.CREDIT_NOTE),
          clientId:          invoice.clientId,
          quoteId:           null,
          orderId:           null,
          originalInvoiceId: invoice.id,
          type:              InvoiceType.CREDIT_NOTE,
          status:            InvoiceStatus.DRAFT,
          discount:          invoice.discount,
          totalHt:           invoice.totalHt,
          totalTva:          invoice.totalTva,
          totalTtc:          invoice.totalTtc,
          note:              reason
            ? `Avoir sur ${invoice.reference} — ${reason}`
            : `Avoir sur ${invoice.reference}`,
          createdBy:         userId,
        }),
      );

      // 2. Copier les lignes de la facture originale
      const creditLines = invoice.lines.map((l) =>
        manager.create(InvoiceLine, {
          invoiceId:   creditNote.id,
          productId:   l.productId,
          description: l.description,
          quantity:    l.quantity,
          unitPrice:   l.unitPrice,
          tvaRate:     l.tvaRate,
          discount:    l.discount,
          totalHt:     l.totalHt,
          position:    l.position,
        }),
      );
      await manager.save(creditLines);

      return creditNote;
    }).then(async (creditNote) => {
      await this.documentsService.restoreStockForCreditNote(creditNote.id);
      return creditNote;
    });
  }

  // ── CANCEL ────────────────────────────────────────────────────
  async cancel(id: number): Promise<Invoice> {
    const invoice = await this.findOne(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException(
        'Impossible d\'annuler une facture PAID — générez un avoir',
      );
    }
    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Facture déjà annulée');
    }

    invoice.status = InvoiceStatus.CANCELLED;
    await this.invoiceRepo.save(invoice);
    return this.findOne(id);
  }

  // ── CRON : passer les factures en OVERDUE ─────────────────────
  @Cron('0 8 * * *') // Tous les jours à 08h00
  async checkOverdue(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await this.invoiceRepo
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: InvoiceStatus.OVERDUE })
      .where('status IN (:...statuses)', {
        statuses: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL],
      })
      .andWhere('due_date < :today', { today })
      .execute();
  }

  // ── STATS ─────────────────────────────────────────────────────
  async getStats() {
    return this.invoiceRepo
      .createQueryBuilder('i')
      .select('i.type',                         'type')
      .addSelect('i.status',                    'status')
      .addSelect('COUNT(*)',                     'count')
      .addSelect('SUM(i.total_ttc)',             'totalTtc')
      .addSelect('SUM(i.total_ttc - i.amount_paid)', 'unpaid')
      .groupBy('i.type, i.status')
      .getRawMany();
  }
}