// src/documents/documents.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EmailsService } from '../emails/emails.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PdfBuilder, fmtMoney, fmtDate, statusColor } from './pdf-builder.util';
import { Quote, QuoteStatus } from '../commercial/quotes/entities/quote.entity';
import { Invoice, InvoiceType, InvoiceStatus } from '../commercial/invoices/entities/invoice.entity';
import { DeliveryNote, DeliveryStatus } from '../commercial/delivery-notes/entities/delivery-note.entity';
import { Order } from '../orders/entities/order.entity';
import { ProductInventory } from '../products/entities/product-inventory.entity';
import { InventorySession, SessionStatus } from '../inventory/entities/inventory-session.entity';
import { InventoryLine } from '../inventory/entities/inventory-line.entity';
import { BomLine } from '../products/entities/bom-line.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';

const COMPANY = process.env.COMPANY_NAME || 'ERP Tunisie';
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || '123 Rue Exemple, Tunis';
const COMPANY_PHONE = process.env.COMPANY_PHONE || '+216 71 234 567';
const COMPANY_EMAIL = process.env.COMPANY_EMAIL || 'contact@erp.tn';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Quote) private quoteRepo: Repository<Quote>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(DeliveryNote) private dnRepo: Repository<DeliveryNote>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(InventorySession) private invSessionRepo: Repository<InventorySession>,
    @InjectRepository(InventoryLine) private invLineRepo: Repository<InventoryLine>,
    @InjectRepository(ProductInventory) private productInventoryRepo: Repository<ProductInventory>,
    @InjectRepository(BomLine) private bomLineRepo: Repository<BomLine>,
    @InjectRepository(InventoryItem) private inventoryItemRepo: Repository<InventoryItem>,
    private readonly emailsService: EmailsService,
    private readonly dataSource: DataSource,
  ) {}

  // ─── MÉTHODES PRIVÉES ──────────────────────────────────────────────

  private getStatusColor(status: string): string {
    return statusColor(status);
  }

  // ─── PDF DEVIS ──────────────────────────────────────────────────
  async generateQuotePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const quote = await this.quoteRepo.findOne({
      where: { id },
      relations: { client: true, lines: { product: true }, creator: true },
    });
    if (!quote) throw new NotFoundException(`Devis #${id} introuvable`);

    const pdf = new PdfBuilder();

    pdf.header(COMPANY, 'DEVIS', { subtitle: `Référence : ${quote.reference}` });

    pdf.infoColumns(
      [
        { label: 'Référence', value: quote.reference },
        { label: 'Date', value: fmtDate(quote.createdAt) },
        { label: 'Validité', value: fmtDate(quote.validUntil) },
        { label: 'Créé par', value: quote.creator ? `${quote.creator.prenom} ${quote.creator.nom}` : '—' },
      ],
      [
        { label: 'Client', value: quote.client.name },
        { label: 'Adresse', value: quote.client.address ?? '' },
        { label: 'Email', value: quote.client.email ?? '' },
        { label: 'Tél', value: quote.client.phone ?? '' },
        { label: 'N° TVA', value: quote.client.tvaNumber ?? '' },
      ],
    );

    pdf.badge(quote.status, this.getStatusColor(quote.status));
    pdf.divider();

    pdf.table(
      [
        { header: 'Description', width: 200 },
        { header: 'Qté', width: 50, align: 'right' },
        { header: 'P.U. HT', width: 80, align: 'right' },
        { header: 'Rem.%', width: 45, align: 'right' },
        { header: 'TVA %', width: 45, align: 'right' },
        { header: 'Total HT', width: 75, align: 'right' },
      ],
      (quote.lines ?? [])
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map(l => [
          l.product?.nom ?? l.description ?? '',
          String(l.quantity),
          Number(l.unitPrice).toFixed(3),
          `${l.discount ?? 0}%`,
          `${l.tvaRate ?? 19}%`,
          Number(l.totalHt).toFixed(3),
        ]),
    );

    pdf.totals([
      { label: 'Total HT', value: fmtMoney(quote.totalHt) },
      { label: 'TVA', value: fmtMoney(quote.totalTva) },
      { label: 'Total TTC', value: fmtMoney(quote.totalTtc), bold: true },
    ]);

    if (quote.note) pdf.note(quote.note);
    pdf.footer(COMPANY);

    return { buffer: await pdf.build(), filename: `${quote.reference}.pdf` };
  }

  // ─── PDF FACTURE / AVOIR ────────────────────────────────────────
  async generateInvoicePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: {
        client: true,
        lines: { product: true },
        payments: true,
        originalInvoice: true,
        creator: true,
      },
    });
    if (!invoice) throw new NotFoundException(`Facture #${id} introuvable`);

    const isCredit = invoice.type === InvoiceType.CREDIT_NOTE;
    const docType = isCredit ? 'AVOIR' : 'FACTURE';

    const pdf = new PdfBuilder();
    pdf.header(COMPANY, docType, { subtitle: `Référence : ${invoice.reference}` });

    const leftInfo: { label: string; value: string }[] = [
      { label: 'Référence', value: invoice.reference },
      { label: 'Date', value: fmtDate(invoice.createdAt) },
    ];
    if (!isCredit && invoice.dueDate) {
      leftInfo.push({ label: 'Échéance', value: fmtDate(invoice.dueDate) });
    }
    if (invoice.originalInvoice) {
      leftInfo.push({ label: 'Facture source', value: invoice.originalInvoice.reference });
    }
    leftInfo.push({ label: 'Créé par', value: invoice.creator ? `${invoice.creator.prenom} ${invoice.creator.nom}` : '—' });

    pdf.infoColumns(leftInfo, [
      { label: 'Client', value: invoice.client.name },
      { label: 'Adresse', value: invoice.client.address ?? '' },
      { label: 'Email', value: invoice.client.email ?? '' },
      { label: 'Tél', value: invoice.client.phone ?? '' },
      { label: 'N° TVA', value: invoice.client.tvaNumber ?? '' },
    ]);

    pdf.badge(invoice.status, this.getStatusColor(invoice.status));
    pdf.divider();

    pdf.table(
      [
        { header: 'Description', width: 210 },
        { header: 'Qté', width: 50, align: 'right' },
        { header: 'P.U. HT', width: 75, align: 'right' },
        { header: 'Rem.%', width: 45, align: 'right' },
        { header: 'TVA %', width: 45, align: 'right' },
        { header: 'Total HT', width: 70, align: 'right' },
      ],
      (invoice.lines ?? [])
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map(l => [
          l.description ?? l.product?.nom ?? '',
          String(l.quantity),
          Number(l.unitPrice).toFixed(3),
          `${l.discount ?? 0}%`,
          `${l.tvaRate ?? 19}%`,
          Number(l.totalHt).toFixed(3),
        ]),
    );

    const totalLines: { label: string; value: string; bold?: boolean; color?: string }[] = [
      { label: 'Total HT', value: fmtMoney(invoice.totalHt) },
      { label: 'TVA', value: fmtMoney(invoice.totalTva) },
      { label: isCredit ? 'Montant à rembourser' : 'Total TTC', value: fmtMoney(invoice.totalTtc), bold: true },
    ];

    if (!isCredit && Number(invoice.amountPaid) > 0) {
      const restant = Number(invoice.totalTtc) - Number(invoice.amountPaid);
      totalLines.push(
        { label: 'Montant payé', value: fmtMoney(invoice.amountPaid), color: '#10B981' },
        { label: 'Restant dû', value: fmtMoney(restant), bold: true, color: restant > 0 ? '#EF4444' : '#10B981' },
      );
    }

    pdf.totals(totalLines);

    if (!isCredit && invoice.payments && invoice.payments.length > 0) {
      pdf.divider();
      pdf.table(
        [
          { header: 'Date paiement', width: 100 },
          { header: 'Méthode', width: 120 },
          { header: 'Référence', width: 150 },
          { header: 'Montant', width: 125, align: 'right' },
        ],
        invoice.payments.map(p => [
          fmtDate(p.paidAt),
          p.method,
          p.reference ?? '—',
          fmtMoney(p.amount),
        ]),
      );
    }

    if (invoice.note) pdf.note(invoice.note);
    pdf.footer(COMPANY);

    return { buffer: await pdf.build(), filename: `${invoice.reference}.pdf` };
  }

  // ─── PDF BON DE LIVRAISON ───────────────────────────────────────
  async generateDeliveryNotePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const dn = await this.dnRepo.findOne({
      where: { id },
      relations: { client: true, lines: { product: true }, order: true, invoice: true, creator: true },
    });
    if (!dn) throw new NotFoundException(`Bon de livraison #${id} introuvable`);

    const pdf = new PdfBuilder();
    pdf.header(COMPANY, 'BON DE LIVRAISON', { subtitle: `Référence : ${dn.reference}` });

    pdf.infoColumns(
      [
        { label: 'Référence', value: dn.reference },
        { label: 'Date', value: fmtDate(dn.createdAt) },
        { label: 'Commande', value: dn.order?.reference ?? '—' },
        { label: 'Facture', value: dn.invoice?.reference ?? '—' },
        { label: 'Créé par', value: dn.creator ? `${dn.creator.prenom} ${dn.creator.nom}` : '—' },
      ],
      [
        { label: 'Client', value: dn.client.name },
        { label: 'Adresse livraison', value: dn.deliveryAddress ?? dn.client.address ?? '' },
        { label: 'Tél', value: dn.client.phone ?? '' },
        { label: 'Email', value: dn.client.email ?? '' },
      ],
    );

    pdf.badge(dn.status, this.getStatusColor(dn.status));
    pdf.divider();

    pdf.table(
      [
        { header: 'Produit', width: 295 },
        { header: 'Qté commandée', width: 100, align: 'right' },
        { header: 'Qté livrée', width: 100, align: 'right' },
      ],
      (dn.lines ?? []).map(l => [
        l.product?.nom ?? `Produit #${l.productId}`,
        String(l.quantityOrdered),
        String(l.quantityDelivered),
      ]),
    );

    if (dn.deliveredAt) {
      pdf.totals([{ label: 'Date de livraison', value: fmtDate(dn.deliveredAt) }]);
    }

    if (dn.note) pdf.note(dn.note);
    pdf.footer(COMPANY);

    return { buffer: await pdf.build(), filename: `${dn.reference}.pdf` };
  }

  // ─── PDF COMMANDE ───────────────────────────────────────────────
  async generateOrderPdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: {
        client: true,
        warehouse: true,
        lines: {
          product: true,
          supplements: { component: true },
        },
        creator: true,
      },
    });
    if (!order) throw new NotFoundException(`Commande #${id} introuvable`);

    const pdf = new PdfBuilder();
    pdf.header(COMPANY, 'COMMANDE CLIENT', { subtitle: `Référence : ${order.reference}` });

    pdf.infoColumns(
      [
        { label: 'Référence', value: order.reference },
        { label: 'Date', value: fmtDate(order.createdAt) },
        { label: 'Entrepôt', value: order.warehouse?.nom ?? '—' },
        { label: 'Créé par', value: order.creator ? `${order.creator.prenom} ${order.creator.nom}` : '—' },
      ],
      [
        { label: 'Client', value: order.client.name },
        { label: 'Adresse', value: order.client.address ?? '' },
        { label: 'Email', value: order.client.email ?? '' },
        { label: 'Tél', value: order.client.phone ?? '' },
        { label: 'N° TVA', value: order.client.tvaNumber ?? '' },
      ],
    );

    pdf.badge(order.status, this.getStatusColor(order.status));
    pdf.divider();

    // Lignes produits + suppléments
    const rows: string[][] = [];

    for (const line of order.lines ?? []) {
      rows.push([
        line.product?.nom ?? 'Produit',
        String(line.quantity),
        Number(line.unitPrice).toFixed(3),
        `${line.discount ?? 0}%`,
        `${line.tvaRate ?? 19}%`,
        Number(line.totalHt).toFixed(3),
      ]);

      if (line.supplements && line.supplements.length > 0) {
        for (const supp of line.supplements) {
          const suppName = supp.component?.nom ?? 'Supplément';
          rows.push([
            `  ├─ ${suppName}`,
            String(supp.quantity),
            Number(supp.unitPrice).toFixed(3),
            '0%',
            `${supp.tvaRate ?? 19}%`,
            Number(supp.totalHt).toFixed(3),
          ]);
        }
      }
    }

    pdf.table(
      [
        { header: 'Produit', width: 200 },
        { header: 'Qté', width: 50, align: 'right' },
        { header: 'P.U. HT', width: 75, align: 'right' },
        { header: 'Rem.%', width: 45, align: 'right' },
        { header: 'TVA %', width: 45, align: 'right' },
        { header: 'Total HT', width: 80, align: 'right' },
      ],
      rows,
    );

    pdf.totals([
      { label: 'Total HT', value: fmtMoney(order.totalHt) },
      { label: 'TVA', value: fmtMoney(order.totalTva) },
      { label: 'Total TTC', value: fmtMoney(order.totalTtc), bold: true },
    ]);

    if (order.note) pdf.note(order.note);
    pdf.footer(COMPANY);

    return { buffer: await pdf.build(), filename: `${order.reference}.pdf` };
  }

  // ─── PDF INVENTAIRE (CORRIGÉ) ────────────────────────────────────
  async generateInventoryPdf(sessionId: number): Promise<{ buffer: Buffer; filename: string }> {
    const session = await this.invSessionRepo.findOne({
      where: { id: sessionId },
      relations: {
        warehouse: true,
        lines: {
          component: true,
        },
      },
    });
    if (!session) throw new NotFoundException(`Session inventaire #${sessionId} introuvable`);

    const pdf = new PdfBuilder();
    pdf.header(COMPANY, 'RAPPORT INVENTAIRE');

    pdf.infoColumns(
      [
        { label: 'Session', value: `#${session.id}` },
        { label: 'Entrepôt', value: session.warehouse?.nom ?? '—' },
        { label: 'Statut', value: session.status },
        { label: 'Date', value: fmtDate(session.createdAt) },
        { label: 'Nom', value: session.nom || '—' },
      ],
      [],
    );

    pdf.badge(session.status, this.getStatusColor(session.status));
    pdf.divider();

    const lines = session.lines ?? [];

    // Calcul des écarts (si quantityCounted est défini)
    const linesWithEcart = lines.filter(l =>
      l.quantityCounted !== null &&
      l.quantityCounted !== undefined &&
      Number(l.quantityCounted) !== Number(l.quantityTheoretical)
    );

    // Statistiques
    const totalCounted = lines.reduce((sum, l) => sum + (l.quantityCounted ?? 0), 0);
    const totalTheoretical = lines.reduce((sum, l) => sum + l.quantityTheoretical, 0);
    const totalEcart = totalCounted - totalTheoretical;

    pdf.table(
      [
        { header: 'Composant', width: 145 },
        { header: 'Référence', width: 80 },
        { header: 'Attendu', width: 65, align: 'right' },
        { header: 'Compté', width: 65, align: 'right' },
        { header: 'Écart', width: 50, align: 'right' },
        { header: 'Notes', width: 90 },
      ],
      lines.map(l => {
        const ecart = l.quantityCounted !== null && l.quantityCounted !== undefined
          ? Number(l.quantityCounted) - Number(l.quantityTheoretical)
          : null;
        return [
          l.component?.nom ?? 'Composant',
          l.component?.reference ?? '—',
          String(l.quantityTheoretical),
          l.quantityCounted !== null && l.quantityCounted !== undefined
            ? String(l.quantityCounted)
            : '—',
          ecart !== null ? (ecart > 0 ? `+${ecart}` : String(ecart)) : '—',
          l.notes || '—',
        ];
      }),
    );

    // Résumé des écarts
    pdf.totals([
      { label: 'Total lignes', value: String(lines.length) },
      { label: 'Lignes avec écart', value: String(linesWithEcart.length), bold: true },
      { label: 'Écart global', value: fmtMoney(totalEcart), bold: true },
    ]);

    if (session.notes) {
      pdf.note(session.notes);
    }

    pdf.footer(COMPANY);

    return { buffer: await pdf.build(), filename: `inventaire-${session.id}.pdf` };
  }

  // ─── ENVOI EMAIL DEVIS ──────────────────────────────────────────
  // FIX Bug #4 : délègue à EmailsService au lieu d'appeler MailerService directement
  async sendQuoteEmail(id: number, userId?: number): Promise<Quote> {
    const quote = await this.quoteRepo.findOne({
      where: { id },
      relations: { client: true, lines: { product: true } },
    });
    if (!quote) throw new NotFoundException(`Devis #${id} introuvable`);
    if (!quote.client.email) {
      throw new BadRequestException("Le client n'a pas d'adresse email");
    }

    const { buffer } = await this.generateQuotePdf(id);
    await this.emailsService.sendQuoteEmail(quote, buffer, userId);

    if (quote.status === QuoteStatus.DRAFT) {
      quote.status = QuoteStatus.SENT;
      await this.quoteRepo.save(quote);
    }

    return this.quoteRepo.findOne({
      where: { id },
      relations: { client: true, lines: { product: true } },
    }) as Promise<Quote>;
  }

  // ─── ENVOI EMAIL FACTURE ────────────────────────────────────────
  // FIX Bug #4 : délègue à EmailsService au lieu d'appeler MailerService directement
  async sendInvoiceEmail(id: number, userId?: number): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: { client: true, lines: { product: true } },
    });
    if (!invoice) throw new NotFoundException(`Facture #${id} introuvable`);
    if (invoice.type === InvoiceType.CREDIT_NOTE) {
      throw new BadRequestException('Utilisez le téléchargement PDF pour les avoirs');
    }
    if (!invoice.client.email) {
      throw new BadRequestException("Le client n'a pas d'adresse email");
    }

    const { buffer } = await this.generateInvoicePdf(id);
    await this.emailsService.sendInvoiceEmail(invoice, buffer, userId);

    if (invoice.status === InvoiceStatus.DRAFT) {
      invoice.status = InvoiceStatus.SENT;
      await this.invoiceRepo.save(invoice);
    }

    return invoice;
  }

  // ─── ENVOI EMAIL BON DE LIVRAISON ──────────────────────────────
  // FIX Bug #4 : délègue à EmailsService au lieu d'appeler MailerService directement
  async sendDeliveryNoteEmail(id: number, userId?: number): Promise<DeliveryNote> {
    const dn = await this.dnRepo.findOne({
      where: { id },
      relations: { client: true },
    });
    if (!dn) throw new NotFoundException(`Bon de livraison #${id} introuvable`);
    if (!dn.client.email) {
      throw new BadRequestException("Le client n'a pas d'adresse email");
    }

    const { buffer } = await this.generateDeliveryNotePdf(id);
    await this.emailsService.sendDeliveryNoteEmail(dn, buffer, userId);

    return dn;
  }

  // ─── RETOUR STOCK SUR AVOIR ─────────────────────────────────────

  async restoreStockForCreditNote(creditNoteId: number): Promise<void> {
    const credit = await this.invoiceRepo.findOne({
      where: { id: creditNoteId, type: InvoiceType.CREDIT_NOTE },
      relations: { lines: true, originalInvoice: true },
    });
    if (!credit?.originalInvoiceId) return;

    const original = await this.invoiceRepo.findOne({
      where: { id: credit.originalInvoiceId },
      relations: { order: true },
    });
    if (!original?.orderId) return;

    const order = await this.orderRepo.findOne({
      where: { id: original.orderId },
      relations: { lines: true },
    });
    if (!order) return;

    await this.dataSource.transaction(async (manager) => {
      for (const creditLine of credit.lines) {
        if (!creditLine.productId) continue;
        const orderLine = order.lines.find(l => l.productId === creditLine.productId);
        if (!orderLine) continue;

        const qty          = Math.min(Number(creditLine.quantity), Number(orderLine.quantity));
        const fromStock    = Number(orderLine.qtyFromStock ?? qty);
        const fromAssembly = Number(orderLine.qtyFromAssembly ?? 0);
        const ratio        = Number(orderLine.quantity) > 0 ? qty / Number(orderLine.quantity) : 1;

        const restoreStock = Math.round(fromStock * ratio * 1000) / 1000;
        if (restoreStock > 0) {
          let item = await manager.findOne(ProductInventory, {
            where: {
              product: { id: creditLine.productId },
              warehouse: { id: order.warehouseId },
            },
          });
          if (item) {
            item.quantity = Number(item.quantity) + restoreStock;
            await manager.save(ProductInventory, item);
          } else {
            await manager.save(ProductInventory, manager.create(ProductInventory, {
              product: { id: creditLine.productId },
              warehouse: { id: order.warehouseId },
              quantity: restoreStock,
            }));
          }
        }

        const restoreAssembly = Math.round(fromAssembly * ratio * 1000) / 1000;
        if (restoreAssembly > 0) {
          const bomLines = await manager.find(BomLine, {
            where: { product: { id: creditLine.productId } },
            relations: { component: true },
          });
          for (const bom of bomLines) {
            const compQty = Number(bom.quantity) * restoreAssembly;
            const invItem = await manager.findOne(InventoryItem, {
              where: {
                component: { id: bom.component.id },
                warehouse: { id: order.warehouseId },
              },
            });
            if (invItem) {
              invItem.quantity = Number(invItem.quantity) + compQty;
              await manager.save(InventoryItem, invItem);
            } else {
              await manager.save(InventoryItem, manager.create(InventoryItem, {
                component: { id: bom.component.id },
                warehouse: { id: order.warehouseId },
                quantity: compQty,
                reservedQty: 0,
              }));
            }
          }
        }
      }
    });
  }
}