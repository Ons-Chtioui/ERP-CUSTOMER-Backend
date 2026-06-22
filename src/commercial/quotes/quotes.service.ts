// src/commercial/quotes/quotes.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository, DataSource, Like } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { QuoteLine } from './entities/quote-line.entity';
import { Invoice, InvoiceStatus, InvoiceType } from '../invoices/entities/invoice.entity';
import { InvoiceLine } from '../invoices/entities/invoice-line.entity';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { QueryQuotesDto } from './dto/query-quotes.dto';

// Transitions autorisées
const STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  [QuoteStatus.DRAFT]:     [QuoteStatus.SENT, QuoteStatus.REFUSED],
  [QuoteStatus.SENT]:      [QuoteStatus.ACCEPTED, QuoteStatus.REFUSED, QuoteStatus.EXPIRED],
  [QuoteStatus.ACCEPTED]:  [],
  [QuoteStatus.REFUSED]:   [],
  [QuoteStatus.EXPIRED]:   [],
  [QuoteStatus.CONVERTED]: [],
};

interface Totals {
  totalHt: number;
  totalTva: number;
  totalTtc: number;
}

@Injectable()
export class QuotesService {
  constructor(
    @InjectRepository(Quote)       private quoteRepo: Repository<Quote>,
    @InjectRepository(QuoteLine)   private lineRepo: Repository<QuoteLine>,
    @InjectRepository(Invoice)     private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceLine) private invoiceLineRepo: Repository<InvoiceLine>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Génération référence ──────────────────────────────────────
  private async generateReference(): Promise<string> {
    const year    = new Date().getFullYear();
    const pattern = `DEV-${year}-%`;
    const count   = await this.quoteRepo.count({ where: { reference: Like(pattern) } });
    return `DEV-${year}-${String(count + 1).padStart(4, '0')}`;
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

    // Remise globale appliquée sur HT et TVA
    const factor = 1 - globalDiscount / 100;
    totalHt  = Math.round(totalHt  * factor * 1000) / 1000;
    totalTva = Math.round(totalTva * factor * 1000) / 1000;

    return { totalHt, totalTva, totalTtc: totalHt + totalTva };
  }

  // ── CREATE ────────────────────────────────────────────────────
  async create(dto: CreateQuoteDto, userId: number): Promise<Quote> {
    const globalDiscount = dto.discount ?? 0;
    const totals         = this.computeTotals(dto.lines, globalDiscount);

    const quote = await this.quoteRepo.save(
      this.quoteRepo.create({
        reference:    await this.generateReference(),
        clientId:     dto.clientId,
        validUntil:   dto.validUntil,
        note:         dto.note ?? null,
        discount:     globalDiscount,
        ...totals,
        createdBy:    userId,
        status:       QuoteStatus.DRAFT,
      }),
    );

    const lines = dto.lines.map((l, idx) =>
      this.lineRepo.create({
        quoteId:     quote.id,
        productId:   l.productId,
        description: l.description ?? null,
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

    return this.findOne(quote.id);
  }

  // ── FIND ALL ──────────────────────────────────────────────────
  async findAll(query: QueryQuotesDto) {
    const qb = this.quoteRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.client',  'client')
      .leftJoinAndSelect('q.creator', 'creator')
      .orderBy('q.created_at', 'DESC');

    if (query.status)   qb.andWhere('q.status = :status',     { status:   query.status });
    if (query.clientId) qb.andWhere('q.client_id = :clientId',{ clientId: query.clientId });
    if (query.dateFrom) qb.andWhere('q.created_at >= :from',  { from:     query.dateFrom });
    if (query.dateTo)   qb.andWhere('q.created_at <= :to',    { to:       query.dateTo });

    const total = await qb.getCount();
    const skip  = ((query.page ?? 1) - 1) * (query.limit ?? 20);
    qb.skip(skip).take(query.limit ?? 20);

    const data = await qb.getMany();
    return { data, total, page: query.page ?? 1, limit: query.limit ?? 20 };
  }

  // ── FIND ONE ──────────────────────────────────────────────────
  async findOne(id: number): Promise<Quote> {
    const quote = await this.quoteRepo.findOne({
      where: { id },
      relations: {
        client: true,
        creator: true,
        lines: { product: true },
      },
    });
    if (!quote) throw new NotFoundException(`Devis #${id} introuvable`);
    return quote;
  }

  // ── UPDATE STATUS ─────────────────────────────────────────────
  async updateStatus(id: number, dto: UpdateQuoteStatusDto): Promise<Quote> {
    const quote   = await this.findOne(id);
    const allowed = STATUS_TRANSITIONS[quote.status];

    if (dto.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException(
        'Utilisez POST /quotes/:id/convert pour convertir un devis en facture',
      );
    }

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transition ${quote.status} → ${dto.status} non autorisée`,
      );
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

  // ── CONVERT TO INVOICE ────────────────────────────────────────
  async convertToInvoice(id: number, userId: number): Promise<Invoice> {
    const quote = await this.findOne(id);

    if (quote.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException('Devis déjà converti en facture');
    }
    if ([QuoteStatus.REFUSED, QuoteStatus.EXPIRED].includes(quote.status)) {
      throw new BadRequestException(
        `Impossible de convertir un devis ${quote.status}`,
      );
    }
    if (quote.status === QuoteStatus.DRAFT) {
      throw new BadRequestException(
        'Le devis doit être au moins SENT ou ACCEPTED pour être converti',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Générer la référence facture
      const year     = new Date().getFullYear();
      const pattern  = `FAC-${year}-%`;
      const invCount = await manager.count(Invoice, {
        where: { reference: Like(pattern) },
      });
      const ref      = `FAC-${year}-${String(invCount + 1).padStart(4, '0')}`;

      // 2. Créer la facture
      const invoice = await manager.save(
        manager.create(Invoice, {
          reference: ref,
          clientId:  quote.clientId,
          quoteId:   quote.id,
          type:      InvoiceType.INVOICE,
          status:    InvoiceStatus.DRAFT,
          discount:  quote.discount,
          totalHt:   quote.totalHt,
          totalTva:  quote.totalTva,
          totalTtc:  quote.totalTtc,
          createdBy: userId,
        }),
      );

      // 3. Copier toutes les lignes du devis vers la facture
      const invoiceLines = quote.lines.map((l) =>
        manager.create(InvoiceLine, {
          invoiceId:   invoice.id,
          productId:   l.productId,
          description: l.description ?? l.product?.nom ?? '',
          quantity:    l.quantity,
          unitPrice:   l.unitPrice,
          tvaRate:     l.tvaRate,
          discount:    l.discount,
          totalHt:     l.totalHt,
          position:    l.position,
        }),
      );
      await manager.save(invoiceLines);

      // 4. Marquer le devis comme converti
      await manager.update(Quote, id, {
        status:      QuoteStatus.CONVERTED,
        convertedTo: invoice.id,
        convertedAt: new Date(),
      });

      return invoice;
    });
  }

  // ── REMOVE (DRAFT only) ───────────────────────────────────────
  async remove(id: number): Promise<void> {
    const quote = await this.findOne(id);
    if (quote.status !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        'Seuls les devis en brouillon peuvent être supprimés',
      );
    }
    await this.quoteRepo.remove(quote);
  }

  // ── CRON : marquer les devis expirés ─────────────────────────
  @Cron('0 7 * * *')
  async markExpiredQuotes(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    await this.quoteRepo
      .createQueryBuilder()
      .update(Quote)
      .set({ status: QuoteStatus.EXPIRED })
      .where('status IN (:...statuses)', {
        statuses: [QuoteStatus.DRAFT, QuoteStatus.SENT],
      })
      .andWhere('valid_until < :today', { today })
      .execute();
  }
}