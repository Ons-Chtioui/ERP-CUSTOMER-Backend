import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PdfBuilder, fmtMoney, fmtDate } from './pdf-builder.util';
import { Quote, QuoteStatus } from '../commercial/quotes/entities/quote.entity';
import { Invoice, InvoiceType } from '../commercial/invoices/entities/invoice.entity';
import { DeliveryNote } from '../commercial/delivery-notes/entities/delivery-note.entity';
import { Order } from '../orders/entities/order.entity';
import { ProductInventory } from '../products/entities/product-inventory.entity';
import { InventorySession } from '../inventory/entities/inventory-session.entity';

const COMPANY = 'ERP Tunisie';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Quote) private quoteRepo: Repository<Quote>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(DeliveryNote) private dnRepo: Repository<DeliveryNote>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(InventorySession) private invSessionRepo: Repository<InventorySession>,
    private readonly mailer: MailerService,
    private readonly dataSource: DataSource,
  ) {}

  // ── PDF Devis ─────────────────────────────────────────────────
  async generateQuotePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const quote = await this.quoteRepo.findOne({
      where: { id },
      relations: { client: true, lines: { product: true } },
    });
    if (!quote) throw new NotFoundException(`Devis #${id} introuvable`);

    const pdf = new PdfBuilder()
      .title('DEVIS')
      .text(`${COMPANY}`, { bold: true })
      .spacer(4)
      .text(`Référence : ${quote.reference}`)
      .text(`Date : ${fmtDate(quote.createdAt)}`)
      .text(`Validité : ${fmtDate(quote.validUntil)}`)
      .text(`Statut : ${quote.status}`)
      .spacer(8)
      .subtitle('Client')
      .text(quote.client.name)
      .text(quote.client.address ?? '')
      .text(`${quote.client.city ?? ''} ${quote.client.country}`)
      .text(quote.client.email ?? '')
      .spacer(10)
      .table(
        [
          { header: 'Description', width: 200 },
          { header: 'Qté', width: 50, align: 'right' },
          { header: 'P.U.', width: 70, align: 'right' },
          { header: 'TVA%', width: 45, align: 'right' },
          { header: 'Total HT', width: 80, align: 'right' },
        ],
        (quote.lines ?? []).map(l => [
          l.product?.nom ?? l.description ?? '',
          String(l.quantity),
          Number(l.unitPrice).toFixed(3),
          String(l.tvaRate),
          Number(l.totalHt).toFixed(3),
        ]),
      )
      .totals([
        { label: 'Total HT', value: fmtMoney(quote.totalHt) },
        { label: 'TVA', value: fmtMoney(quote.totalTva) },
        { label: 'Total TTC', value: fmtMoney(quote.totalTtc), bold: true },
      ]);

    if (quote.note) pdf.spacer(8).text(`Note : ${quote.note}`);

    return { buffer: pdf.build(), filename: `${quote.reference}.pdf` };
  }

  // ── PDF Facture / Avoir ───────────────────────────────────────
  async generateInvoicePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: { client: true, lines: { product: true }, payments: true, originalInvoice: true },
    });
    if (!invoice) throw new NotFoundException(`Facture #${id} introuvable`);

    const isCredit = invoice.type === InvoiceType.CREDIT_NOTE;
    const pdf = new PdfBuilder()
      .title(isCredit ? 'AVOIR' : 'FACTURE')
      .text(`${COMPANY}`, { bold: true })
      .spacer(4)
      .text(`Référence : ${invoice.reference}`)
      .text(`Date : ${fmtDate(invoice.createdAt)}`)
      .text(`Échéance : ${fmtDate(invoice.dueDate)}`)
      .text(`Statut : ${invoice.status}`);

    if (invoice.originalInvoice) {
      pdf.text(`Facture source : ${invoice.originalInvoice.reference}`);
    }

    pdf.spacer(8)
      .subtitle('Client')
      .text(invoice.client.name)
      .text(invoice.client.address ?? '')
      .text(invoice.client.tvaNumber ? `MF : ${invoice.client.tvaNumber}` : '')
      .spacer(10)
      .table(
        [
          { header: 'Description', width: 200 },
          { header: 'Qté', width: 50, align: 'right' },
          { header: 'P.U.', width: 70, align: 'right' },
          { header: 'TVA%', width: 45, align: 'right' },
          { header: 'Total HT', width: 80, align: 'right' },
        ],
        (invoice.lines ?? []).map(l => [
          l.description,
          String(l.quantity),
          Number(l.unitPrice).toFixed(3),
          String(l.tvaRate),
          Number(l.totalHt).toFixed(3),
        ]),
      )
      .totals([
        { label: 'Total HT', value: fmtMoney(invoice.totalHt) },
        { label: 'TVA', value: fmtMoney(invoice.totalTva) },
        { label: 'Total TTC', value: fmtMoney(invoice.totalTtc), bold: true },
      ]);

    if (!isCredit && Number(invoice.amountPaid) > 0) {
      pdf.totals([
        { label: 'Montant payé', value: fmtMoney(invoice.amountPaid) },
        { label: 'Restant dû', value: fmtMoney(Number(invoice.totalTtc) - Number(invoice.amountPaid)), bold: true },
      ]);
    }

    return { buffer: pdf.build(), filename: `${invoice.reference}.pdf` };
  }

  // ── PDF Bon de livraison ──────────────────────────────────────
  async generateDeliveryNotePdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const dn = await this.dnRepo.findOne({
      where: { id },
      relations: { client: true, lines: { product: true }, order: true, invoice: true },
    });
    if (!dn) throw new NotFoundException(`BL #${id} introuvable`);

    const pdf = new PdfBuilder()
      .title('BON DE LIVRAISON')
      .text(`${COMPANY}`, { bold: true })
      .spacer(4)
      .text(`Référence : ${dn.reference}`)
      .text(`Date : ${fmtDate(dn.createdAt)}`)
      .text(`Statut : ${dn.status}`)
      .text(dn.order ? `Commande : ${dn.order.reference}` : '')
      .text(dn.invoice ? `Facture : ${dn.invoice.reference}` : '')
      .spacer(8)
      .subtitle('Client')
      .text(dn.client.name)
      .text(dn.deliveryAddress ?? dn.client.address ?? '')
      .spacer(10)
      .table(
        [
          { header: 'Produit', width: 250 },
          { header: 'Qté cmd.', width: 80, align: 'right' },
          { header: 'Qté livrée', width: 80, align: 'right' },
        ],
        (dn.lines ?? []).map(l => [
          l.product?.nom ?? `Produit #${l.productId}`,
          String(l.quantityOrdered),
          String(l.quantityDelivered),
        ]),
      );

    if (dn.deliveredAt) pdf.spacer(10).text(`Livré le : ${fmtDate(dn.deliveredAt)}`);
    if (dn.signatureUrl) pdf.text('Signature client : reçue');

    return { buffer: pdf.build(), filename: `${dn.reference}.pdf` };
  }

  // ── PDF Commande ──────────────────────────────────────────────
  async generateOrderPdf(id: number): Promise<{ buffer: Buffer; filename: string }> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { client: true, warehouse: true, lines: { product: true } },
    });
    if (!order) throw new NotFoundException(`Commande #${id} introuvable`);

    const pdf = new PdfBuilder()
      .title('COMMANDE CLIENT')
      .text(`${COMPANY}`, { bold: true })
      .spacer(4)
      .text(`Référence : ${order.reference}`)
      .text(`Date : ${fmtDate(order.createdAt)}`)
      .text(`Statut : ${order.status}`)
      .text(`Entrepôt : ${order.warehouse?.nom ?? '—'}`)
      .spacer(8)
      .subtitle('Client')
      .text(order.client.name)
      .spacer(10)
      .table(
        [
          { header: 'Produit', width: 200 },
          { header: 'Qté', width: 50, align: 'right' },
          { header: 'P.U.', width: 70, align: 'right' },
          { header: 'Rem.%', width: 45, align: 'right' },
          { header: 'Total HT', width: 80, align: 'right' },
        ],
        (order.lines ?? []).map(l => [
          l.product?.nom ?? '',
          String(l.quantity),
          Number(l.unitPrice).toFixed(3),
          String(l.discount),
          Number(l.totalHt).toFixed(3),
        ]),
      )
      .totals([
        { label: 'Total HT', value: fmtMoney(order.totalHt) },
        { label: 'TVA', value: fmtMoney(order.totalTva) },
        { label: 'Total TTC', value: fmtMoney(order.totalTtc), bold: true },
      ]);

    return { buffer: pdf.build(), filename: `${order.reference}.pdf` };
  }

  // ── PDF Inventaire ────────────────────────────────────────────
  async generateInventoryPdf(sessionId: number): Promise<{ buffer: Buffer; filename: string }> {
    const session = await this.invSessionRepo.findOne({
      where: { id: sessionId },
      relations: { warehouse: true, lines: { component: true } },
    });
    if (!session) throw new NotFoundException(`Session inventaire #${sessionId} introuvable`);

    const pdf = new PdfBuilder()
      .title('RAPPORT INVENTAIRE')
      .text(`${COMPANY}`, { bold: true })
      .spacer(4)
      .text(`Session #${session.id}`)
      .text(`Entrepôt : ${session.warehouse?.nom ?? '—'}`)
      .text(`Statut : ${session.status}`)
      .text(`Date : ${fmtDate(session.createdAt)}`)
      .spacer(10)
      .table(
        [
          { header: 'Composant', width: 200 },
          { header: 'Attendu', width: 70, align: 'right' },
          { header: 'Compté', width: 70, align: 'right' },
          { header: 'Écart', width: 70, align: 'right' },
        ],
        (session.lines ?? []).map(l => [
          l.component?.nom ?? '',
          String(l.quantityTheoretical),
          String(l.quantityCounted ?? '—'),
          String(l.ecart ?? (l.quantityCounted != null ? Number(l.quantityCounted) - Number(l.quantityTheoretical) : '—')),
        ]),
      );

    return { buffer: pdf.build(), filename: `inventaire-${session.id}.pdf` };
  }

  // ── Envoi email avec PDF ──────────────────────────────────────
  async sendQuoteEmail(id: number): Promise<Quote> {
    const quote = await this.quoteRepo.findOne({
      where: { id },
      relations: { client: true },
    });
    if (!quote) throw new NotFoundException(`Devis #${id} introuvable`);
    if (!quote.client.email) {
      throw new BadRequestException('Le client n\'a pas d\'adresse email');
    }

    const { buffer, filename } = await this.generateQuotePdf(id);

    await this.mailer.sendMail({
      to: quote.client.email,
      subject: `Devis ${quote.reference} — ${COMPANY}`,
      html: `<p>Bonjour ${quote.client.name},</p>
             <p>Veuillez trouver ci-joint votre devis <strong>${quote.reference}</strong>.</p>
             <p>Montant TTC : <strong>${fmtMoney(quote.totalTtc)}</strong></p>
             <p>Validité : ${fmtDate(quote.validUntil)}</p>
             <p>Cordialement,<br/>${COMPANY}</p>`,
      attachments: [{ filename, content: buffer, contentType: 'application/pdf' }],
    });

    if (quote.status === QuoteStatus.DRAFT) {
      quote.status = QuoteStatus.SENT;
      await this.quoteRepo.save(quote);
    }
    return this.quoteRepo.findOne({ where: { id }, relations: { client: true, lines: { product: true } } }) as Promise<Quote>;
  }

  async sendInvoiceEmail(id: number): Promise<Invoice> {
    const invoice = await this.invoiceRepo.findOne({
      where: { id },
      relations: { client: true },
    });
    if (!invoice) throw new NotFoundException(`Facture #${id} introuvable`);
    if (invoice.type === InvoiceType.CREDIT_NOTE) {
      throw new BadRequestException('Utilisez le téléchargement PDF pour les avoirs');
    }
    if (!invoice.client.email) {
      throw new BadRequestException('Le client n\'a pas d\'adresse email');
    }

    const { buffer, filename } = await this.generateInvoicePdf(id);

    await this.mailer.sendMail({
      to: invoice.client.email,
      subject: `Facture ${invoice.reference} — ${COMPANY}`,
      html: `<p>Bonjour ${invoice.client.name},</p>
             <p>Veuillez trouver ci-joint votre facture <strong>${invoice.reference}</strong>.</p>
             <p>Montant TTC : <strong>${fmtMoney(invoice.totalTtc)}</strong></p>
             ${invoice.dueDate ? `<p>Échéance : ${fmtDate(invoice.dueDate)}</p>` : ''}
             <p>Cordialement,<br/>${COMPANY}</p>`,
      attachments: [{ filename, content: buffer, contentType: 'application/pdf' }],
    });

    return invoice;
  }

  // ── Retour stock sur avoir (si facture liée à une commande) ───
  async restoreStockForCreditNote(creditNoteId: number): Promise<void> {
    const credit = await this.invoiceRepo.findOne({
      where: { id: creditNoteId, type: InvoiceType.CREDIT_NOTE },
      relations: { lines: true, originalInvoice: true },
    });
    if (!credit?.originalInvoiceId) return;

    const original = await this.invoiceRepo.findOne({
      where: { id: credit.originalInvoiceId },
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

        const qty = Math.min(Number(creditLine.quantity), Number(orderLine.quantity));
        let item = await manager.findOne(ProductInventory, {
          where: { product: { id: creditLine.productId }, warehouse: { id: order.warehouseId } },
        });
        if (item) {
          item.quantity = Number(item.quantity) + qty;
          await manager.save(ProductInventory, item);
        } else {
          await manager.save(ProductInventory, manager.create(ProductInventory, {
            product: { id: creditLine.productId },
            warehouse: { id: order.warehouseId },
            quantity: qty,
          }));
        }
      }
    });
  }
}
