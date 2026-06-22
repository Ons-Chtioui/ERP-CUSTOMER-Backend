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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const pdf_builder_util_1 = require("./pdf-builder.util");
const quote_entity_1 = require("../commercial/quotes/entities/quote.entity");
const invoice_entity_1 = require("../commercial/invoices/entities/invoice.entity");
const delivery_note_entity_1 = require("../commercial/delivery-notes/entities/delivery-note.entity");
const order_entity_1 = require("../orders/entities/order.entity");
const product_inventory_entity_1 = require("../products/entities/product-inventory.entity");
const inventory_session_entity_1 = require("../inventory/entities/inventory-session.entity");
const COMPANY = 'ERP Tunisie';
let DocumentsService = class DocumentsService {
    quoteRepo;
    invoiceRepo;
    dnRepo;
    orderRepo;
    invSessionRepo;
    mailer;
    dataSource;
    constructor(quoteRepo, invoiceRepo, dnRepo, orderRepo, invSessionRepo, mailer, dataSource) {
        this.quoteRepo = quoteRepo;
        this.invoiceRepo = invoiceRepo;
        this.dnRepo = dnRepo;
        this.orderRepo = orderRepo;
        this.invSessionRepo = invSessionRepo;
        this.mailer = mailer;
        this.dataSource = dataSource;
    }
    async generateQuotePdf(id) {
        const quote = await this.quoteRepo.findOne({
            where: { id },
            relations: { client: true, lines: { product: true } },
        });
        if (!quote)
            throw new common_1.NotFoundException(`Devis #${id} introuvable`);
        const pdf = new pdf_builder_util_1.PdfBuilder()
            .title('DEVIS')
            .text(`${COMPANY}`, { bold: true })
            .spacer(4)
            .text(`Référence : ${quote.reference}`)
            .text(`Date : ${(0, pdf_builder_util_1.fmtDate)(quote.createdAt)}`)
            .text(`Validité : ${(0, pdf_builder_util_1.fmtDate)(quote.validUntil)}`)
            .text(`Statut : ${quote.status}`)
            .spacer(8)
            .subtitle('Client')
            .text(quote.client.name)
            .text(quote.client.address ?? '')
            .text(`${quote.client.city ?? ''} ${quote.client.country}`)
            .text(quote.client.email ?? '')
            .spacer(10)
            .table([
            { header: 'Description', width: 200 },
            { header: 'Qté', width: 50, align: 'right' },
            { header: 'P.U.', width: 70, align: 'right' },
            { header: 'TVA%', width: 45, align: 'right' },
            { header: 'Total HT', width: 80, align: 'right' },
        ], (quote.lines ?? []).map(l => [
            l.product?.nom ?? l.description ?? '',
            String(l.quantity),
            Number(l.unitPrice).toFixed(3),
            String(l.tvaRate),
            Number(l.totalHt).toFixed(3),
        ]))
            .totals([
            { label: 'Total HT', value: (0, pdf_builder_util_1.fmtMoney)(quote.totalHt) },
            { label: 'TVA', value: (0, pdf_builder_util_1.fmtMoney)(quote.totalTva) },
            { label: 'Total TTC', value: (0, pdf_builder_util_1.fmtMoney)(quote.totalTtc), bold: true },
        ]);
        if (quote.note)
            pdf.spacer(8).text(`Note : ${quote.note}`);
        return { buffer: pdf.build(), filename: `${quote.reference}.pdf` };
    }
    async generateInvoicePdf(id) {
        const invoice = await this.invoiceRepo.findOne({
            where: { id },
            relations: { client: true, lines: { product: true }, payments: true, originalInvoice: true },
        });
        if (!invoice)
            throw new common_1.NotFoundException(`Facture #${id} introuvable`);
        const isCredit = invoice.type === invoice_entity_1.InvoiceType.CREDIT_NOTE;
        const pdf = new pdf_builder_util_1.PdfBuilder()
            .title(isCredit ? 'AVOIR' : 'FACTURE')
            .text(`${COMPANY}`, { bold: true })
            .spacer(4)
            .text(`Référence : ${invoice.reference}`)
            .text(`Date : ${(0, pdf_builder_util_1.fmtDate)(invoice.createdAt)}`)
            .text(`Échéance : ${(0, pdf_builder_util_1.fmtDate)(invoice.dueDate)}`)
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
            .table([
            { header: 'Description', width: 200 },
            { header: 'Qté', width: 50, align: 'right' },
            { header: 'P.U.', width: 70, align: 'right' },
            { header: 'TVA%', width: 45, align: 'right' },
            { header: 'Total HT', width: 80, align: 'right' },
        ], (invoice.lines ?? []).map(l => [
            l.description,
            String(l.quantity),
            Number(l.unitPrice).toFixed(3),
            String(l.tvaRate),
            Number(l.totalHt).toFixed(3),
        ]))
            .totals([
            { label: 'Total HT', value: (0, pdf_builder_util_1.fmtMoney)(invoice.totalHt) },
            { label: 'TVA', value: (0, pdf_builder_util_1.fmtMoney)(invoice.totalTva) },
            { label: 'Total TTC', value: (0, pdf_builder_util_1.fmtMoney)(invoice.totalTtc), bold: true },
        ]);
        if (!isCredit && Number(invoice.amountPaid) > 0) {
            pdf.totals([
                { label: 'Montant payé', value: (0, pdf_builder_util_1.fmtMoney)(invoice.amountPaid) },
                { label: 'Restant dû', value: (0, pdf_builder_util_1.fmtMoney)(Number(invoice.totalTtc) - Number(invoice.amountPaid)), bold: true },
            ]);
        }
        return { buffer: pdf.build(), filename: `${invoice.reference}.pdf` };
    }
    async generateDeliveryNotePdf(id) {
        const dn = await this.dnRepo.findOne({
            where: { id },
            relations: { client: true, lines: { product: true }, order: true, invoice: true },
        });
        if (!dn)
            throw new common_1.NotFoundException(`BL #${id} introuvable`);
        const pdf = new pdf_builder_util_1.PdfBuilder()
            .title('BON DE LIVRAISON')
            .text(`${COMPANY}`, { bold: true })
            .spacer(4)
            .text(`Référence : ${dn.reference}`)
            .text(`Date : ${(0, pdf_builder_util_1.fmtDate)(dn.createdAt)}`)
            .text(`Statut : ${dn.status}`)
            .text(dn.order ? `Commande : ${dn.order.reference}` : '')
            .text(dn.invoice ? `Facture : ${dn.invoice.reference}` : '')
            .spacer(8)
            .subtitle('Client')
            .text(dn.client.name)
            .text(dn.deliveryAddress ?? dn.client.address ?? '')
            .spacer(10)
            .table([
            { header: 'Produit', width: 250 },
            { header: 'Qté cmd.', width: 80, align: 'right' },
            { header: 'Qté livrée', width: 80, align: 'right' },
        ], (dn.lines ?? []).map(l => [
            l.product?.nom ?? `Produit #${l.productId}`,
            String(l.quantityOrdered),
            String(l.quantityDelivered),
        ]));
        if (dn.deliveredAt)
            pdf.spacer(10).text(`Livré le : ${(0, pdf_builder_util_1.fmtDate)(dn.deliveredAt)}`);
        if (dn.signatureUrl)
            pdf.text('Signature client : reçue');
        return { buffer: pdf.build(), filename: `${dn.reference}.pdf` };
    }
    async generateOrderPdf(id) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: { client: true, warehouse: true, lines: { product: true } },
        });
        if (!order)
            throw new common_1.NotFoundException(`Commande #${id} introuvable`);
        const pdf = new pdf_builder_util_1.PdfBuilder()
            .title('COMMANDE CLIENT')
            .text(`${COMPANY}`, { bold: true })
            .spacer(4)
            .text(`Référence : ${order.reference}`)
            .text(`Date : ${(0, pdf_builder_util_1.fmtDate)(order.createdAt)}`)
            .text(`Statut : ${order.status}`)
            .text(`Entrepôt : ${order.warehouse?.nom ?? '—'}`)
            .spacer(8)
            .subtitle('Client')
            .text(order.client.name)
            .spacer(10)
            .table([
            { header: 'Produit', width: 200 },
            { header: 'Qté', width: 50, align: 'right' },
            { header: 'P.U.', width: 70, align: 'right' },
            { header: 'Rem.%', width: 45, align: 'right' },
            { header: 'Total HT', width: 80, align: 'right' },
        ], (order.lines ?? []).map(l => [
            l.product?.nom ?? '',
            String(l.quantity),
            Number(l.unitPrice).toFixed(3),
            String(l.discount),
            Number(l.totalHt).toFixed(3),
        ]))
            .totals([
            { label: 'Total HT', value: (0, pdf_builder_util_1.fmtMoney)(order.totalHt) },
            { label: 'TVA', value: (0, pdf_builder_util_1.fmtMoney)(order.totalTva) },
            { label: 'Total TTC', value: (0, pdf_builder_util_1.fmtMoney)(order.totalTtc), bold: true },
        ]);
        return { buffer: pdf.build(), filename: `${order.reference}.pdf` };
    }
    async generateInventoryPdf(sessionId) {
        const session = await this.invSessionRepo.findOne({
            where: { id: sessionId },
            relations: { warehouse: true, lines: { component: true } },
        });
        if (!session)
            throw new common_1.NotFoundException(`Session inventaire #${sessionId} introuvable`);
        const pdf = new pdf_builder_util_1.PdfBuilder()
            .title('RAPPORT INVENTAIRE')
            .text(`${COMPANY}`, { bold: true })
            .spacer(4)
            .text(`Session #${session.id}`)
            .text(`Entrepôt : ${session.warehouse?.nom ?? '—'}`)
            .text(`Statut : ${session.status}`)
            .text(`Date : ${(0, pdf_builder_util_1.fmtDate)(session.createdAt)}`)
            .spacer(10)
            .table([
            { header: 'Composant', width: 200 },
            { header: 'Attendu', width: 70, align: 'right' },
            { header: 'Compté', width: 70, align: 'right' },
            { header: 'Écart', width: 70, align: 'right' },
        ], (session.lines ?? []).map(l => [
            l.component?.nom ?? '',
            String(l.quantityTheoretical),
            String(l.quantityCounted ?? '—'),
            String(l.ecart ?? (l.quantityCounted != null ? Number(l.quantityCounted) - Number(l.quantityTheoretical) : '—')),
        ]));
        return { buffer: pdf.build(), filename: `inventaire-${session.id}.pdf` };
    }
    async sendQuoteEmail(id) {
        const quote = await this.quoteRepo.findOne({
            where: { id },
            relations: { client: true },
        });
        if (!quote)
            throw new common_1.NotFoundException(`Devis #${id} introuvable`);
        if (!quote.client.email) {
            throw new common_1.BadRequestException('Le client n\'a pas d\'adresse email');
        }
        const { buffer, filename } = await this.generateQuotePdf(id);
        await this.mailer.sendMail({
            to: quote.client.email,
            subject: `Devis ${quote.reference} — ${COMPANY}`,
            html: `<p>Bonjour ${quote.client.name},</p>
             <p>Veuillez trouver ci-joint votre devis <strong>${quote.reference}</strong>.</p>
             <p>Montant TTC : <strong>${(0, pdf_builder_util_1.fmtMoney)(quote.totalTtc)}</strong></p>
             <p>Validité : ${(0, pdf_builder_util_1.fmtDate)(quote.validUntil)}</p>
             <p>Cordialement,<br/>${COMPANY}</p>`,
            attachments: [{ filename, content: buffer, contentType: 'application/pdf' }],
        });
        if (quote.status === quote_entity_1.QuoteStatus.DRAFT) {
            quote.status = quote_entity_1.QuoteStatus.SENT;
            await this.quoteRepo.save(quote);
        }
        return this.quoteRepo.findOne({ where: { id }, relations: { client: true, lines: { product: true } } });
    }
    async sendInvoiceEmail(id) {
        const invoice = await this.invoiceRepo.findOne({
            where: { id },
            relations: { client: true },
        });
        if (!invoice)
            throw new common_1.NotFoundException(`Facture #${id} introuvable`);
        if (invoice.type === invoice_entity_1.InvoiceType.CREDIT_NOTE) {
            throw new common_1.BadRequestException('Utilisez le téléchargement PDF pour les avoirs');
        }
        if (!invoice.client.email) {
            throw new common_1.BadRequestException('Le client n\'a pas d\'adresse email');
        }
        const { buffer, filename } = await this.generateInvoicePdf(id);
        await this.mailer.sendMail({
            to: invoice.client.email,
            subject: `Facture ${invoice.reference} — ${COMPANY}`,
            html: `<p>Bonjour ${invoice.client.name},</p>
             <p>Veuillez trouver ci-joint votre facture <strong>${invoice.reference}</strong>.</p>
             <p>Montant TTC : <strong>${(0, pdf_builder_util_1.fmtMoney)(invoice.totalTtc)}</strong></p>
             ${invoice.dueDate ? `<p>Échéance : ${(0, pdf_builder_util_1.fmtDate)(invoice.dueDate)}</p>` : ''}
             <p>Cordialement,<br/>${COMPANY}</p>`,
            attachments: [{ filename, content: buffer, contentType: 'application/pdf' }],
        });
        return invoice;
    }
    async restoreStockForCreditNote(creditNoteId) {
        const credit = await this.invoiceRepo.findOne({
            where: { id: creditNoteId, type: invoice_entity_1.InvoiceType.CREDIT_NOTE },
            relations: { lines: true, originalInvoice: true },
        });
        if (!credit?.originalInvoiceId)
            return;
        const original = await this.invoiceRepo.findOne({
            where: { id: credit.originalInvoiceId },
        });
        if (!original?.orderId)
            return;
        const order = await this.orderRepo.findOne({
            where: { id: original.orderId },
            relations: { lines: true },
        });
        if (!order)
            return;
        await this.dataSource.transaction(async (manager) => {
            for (const creditLine of credit.lines) {
                if (!creditLine.productId)
                    continue;
                const orderLine = order.lines.find(l => l.productId === creditLine.productId);
                if (!orderLine)
                    continue;
                const qty = Math.min(Number(creditLine.quantity), Number(orderLine.quantity));
                let item = await manager.findOne(product_inventory_entity_1.ProductInventory, {
                    where: { product: { id: creditLine.productId }, warehouse: { id: order.warehouseId } },
                });
                if (item) {
                    item.quantity = Number(item.quantity) + qty;
                    await manager.save(product_inventory_entity_1.ProductInventory, item);
                }
                else {
                    await manager.save(product_inventory_entity_1.ProductInventory, manager.create(product_inventory_entity_1.ProductInventory, {
                        product: { id: creditLine.productId },
                        warehouse: { id: order.warehouseId },
                        quantity: qty,
                    }));
                }
            }
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(quote_entity_1.Quote)),
    __param(1, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(2, (0, typeorm_1.InjectRepository)(delivery_note_entity_1.DeliveryNote)),
    __param(3, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(4, (0, typeorm_1.InjectRepository)(inventory_session_entity_1.InventorySession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        mailer_1.MailerService,
        typeorm_2.DataSource])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map