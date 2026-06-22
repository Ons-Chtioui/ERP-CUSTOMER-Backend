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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../orders/entities/order.entity");
const invoice_entity_1 = require("../commercial/invoices/entities/invoice.entity");
const quote_entity_1 = require("../commercial/quotes/entities/quote.entity");
const stock_alert_entity_1 = require("../stock-alerts/entities/stock-alert.entity");
const warehouse_entity_1 = require("../warehouses/entities/warehouse.entity");
const inventory_item_entity_1 = require("../components/entities/inventory-item.entity");
const order_line_entity_1 = require("../orders/entities/order-line.entity");
const invoice_line_entity_1 = require("../commercial/invoices/entities/invoice-line.entity");
let DashboardService = class DashboardService {
    orderRepo;
    invoiceRepo;
    quoteRepo;
    alertRepo;
    warehouseRepo;
    invItemRepo;
    orderLineRepo;
    invoiceLineRepo;
    constructor(orderRepo, invoiceRepo, quoteRepo, alertRepo, warehouseRepo, invItemRepo, orderLineRepo, invoiceLineRepo) {
        this.orderRepo = orderRepo;
        this.invoiceRepo = invoiceRepo;
        this.quoteRepo = quoteRepo;
        this.alertRepo = alertRepo;
        this.warehouseRepo = warehouseRepo;
        this.invItemRepo = invItemRepo;
        this.orderLineRepo = orderLineRepo;
        this.invoiceLineRepo = invoiceLineRepo;
    }
    async getAnalytics() {
        const [revenueRow, orderStats, invoiceStats, quoteStats, topProducts, alerts, warehousePerf, monthlyRevenue,] = await Promise.all([
            this.invoiceRepo
                .createQueryBuilder('i')
                .select('COALESCE(SUM(i.amount_paid), 0)', 'paid')
                .addSelect('COALESCE(SUM(i.total_ttc - i.amount_paid), 0)', 'unpaid')
                .where('i.type = :type', { type: invoice_entity_1.InvoiceType.INVOICE })
                .andWhere('i.status != :cancelled', { cancelled: invoice_entity_1.InvoiceStatus.CANCELLED })
                .getRawOne(),
            this.orderRepo
                .createQueryBuilder('o')
                .select('o.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .addSelect('COALESCE(SUM(o.total_ttc), 0)', 'total')
                .groupBy('o.status')
                .getRawMany(),
            this.invoiceRepo
                .createQueryBuilder('i')
                .select('i.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .addSelect('COALESCE(SUM(i.total_ttc), 0)', 'total')
                .where('i.type = :type', { type: invoice_entity_1.InvoiceType.INVOICE })
                .groupBy('i.status')
                .getRawMany(),
            this.quoteRepo
                .createQueryBuilder('q')
                .select('q.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .getRawMany(),
            this.orderLineRepo
                .createQueryBuilder('ol')
                .innerJoin('ol.product', 'p')
                .select('p.nom', 'name')
                .addSelect('p.reference', 'reference')
                .addSelect('SUM(ol.quantity)', 'quantity')
                .addSelect('SUM(ol.total_ht)', 'revenue')
                .groupBy('p.id, p.nom, p.reference')
                .orderBy('SUM(ol.quantity)', 'DESC')
                .limit(10)
                .getRawMany(),
            this.alertRepo
                .createQueryBuilder('a')
                .leftJoinAndSelect('a.component', 'component')
                .leftJoinAndSelect('a.warehouse', 'warehouse')
                .where('a.status = :status', { status: 'active' })
                .orderBy('a.created_at', 'DESC')
                .take(10)
                .getMany(),
            this.warehouseRepo.find({ where: { isActive: true } }).then(async (warehouses) => {
                return Promise.all(warehouses.map(async (w) => {
                    const items = await this.invItemRepo.find({
                        where: { warehouse: { id: w.id } },
                        relations: { component: true },
                    });
                    return {
                        id: w.id,
                        name: w.nom,
                        code: w.code,
                        items: items.length,
                        value: items.reduce((s, i) => s + Number(i.quantity) * Number(i.component?.prixAchat ?? 0), 0),
                    };
                }));
            }),
            this.invoiceRepo
                .createQueryBuilder('i')
                .select("TO_CHAR(i.created_at, 'YYYY-MM')", 'month')
                .addSelect('COALESCE(SUM(i.amount_paid), 0)', 'revenue')
                .where('i.type = :type', { type: invoice_entity_1.InvoiceType.INVOICE })
                .groupBy("TO_CHAR(i.created_at, 'YYYY-MM')")
                .orderBy("TO_CHAR(i.created_at, 'YYYY-MM')", 'ASC')
                .limit(12)
                .getRawMany(),
        ]);
        const quotesTotal = quoteStats.reduce((s, r) => s + Number(r.count), 0);
        const quotesConverted = quoteStats.find(r => r.status === quote_entity_1.QuoteStatus.CONVERTED)?.count ?? 0;
        return {
            revenue: {
                paid: Number(revenueRow?.paid ?? 0),
                unpaid: Number(revenueRow?.unpaid ?? 0),
            },
            orders: {
                byStatus: orderStats.map(r => ({
                    status: r.status,
                    count: Number(r.count),
                    total: Number(r.total),
                })),
                delivered: orderStats.find(r => r.status === order_entity_1.OrderStatus.DELIVERED)?.count ?? 0,
            },
            invoices: {
                byStatus: invoiceStats.map(r => ({
                    status: r.status,
                    count: Number(r.count),
                    total: Number(r.total),
                })),
                overdue: invoiceStats.find(r => r.status === invoice_entity_1.InvoiceStatus.OVERDUE)?.count ?? 0,
            },
            quotes: {
                byStatus: quoteStats.map(r => ({ status: r.status, count: Number(r.count) })),
                conversionRate: quotesTotal > 0
                    ? Math.round((Number(quotesConverted) / quotesTotal) * 100)
                    : 0,
            },
            topProducts: topProducts.map(p => ({
                name: p.name,
                reference: p.reference,
                quantity: Number(p.quantity),
                revenue: Number(p.revenue),
            })),
            stockAlerts: alerts.map(a => ({
                id: a.id,
                component: a.component?.nom,
                warehouse: a.warehouse?.nom,
                quantity: a.quantityAtAlert,
                threshold: a.threshold,
            })),
            warehouses: warehousePerf.map(w => ({
                id: w.id,
                name: w.name,
                code: w.code,
                items: w.items,
                value: Math.round(w.value * 100) / 100,
            })),
            monthlyRevenue: monthlyRevenue.map(m => ({
                month: m.month,
                revenue: Number(m.revenue),
            })),
        };
    }
    async exportCsv(type) {
        if (type === 'orders') {
            const orders = await this.orderRepo.find({ relations: { client: true } });
            const header = 'Reference;Client;Statut;Total TTC;Date\n';
            const rows = orders.map(o => `${o.reference};${o.client?.name};${o.status};${o.totalTtc};${o.createdAt.toISOString()}`).join('\n');
            return header + rows;
        }
        if (type === 'invoices') {
            const invoices = await this.invoiceRepo.find({ relations: { client: true } });
            const header = 'Reference;Client;Type;Statut;Total TTC;Paye;Date\n';
            const rows = invoices.map(i => `${i.reference};${i.client?.name};${i.type};${i.status};${i.totalTtc};${i.amountPaid};${i.createdAt.toISOString()}`).join('\n');
            return header + rows;
        }
        const data = await this.getAnalytics();
        return [
            'Section;Indicateur;Valeur',
            `Revenue;Encaisse;${data.revenue.paid}`,
            `Revenue;Impaye;${data.revenue.unpaid}`,
            `Commandes;Livrees;${data.orders.delivered}`,
            `Factures;En retard;${data.invoices.overdue}`,
            `Devis;Taux conversion;${data.quotes.conversionRate}%`,
        ].join('\n');
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(2, (0, typeorm_1.InjectRepository)(quote_entity_1.Quote)),
    __param(3, (0, typeorm_1.InjectRepository)(stock_alert_entity_1.StockAlert)),
    __param(4, (0, typeorm_1.InjectRepository)(warehouse_entity_1.Warehouse)),
    __param(5, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItem)),
    __param(6, (0, typeorm_1.InjectRepository)(order_line_entity_1.OrderLine)),
    __param(7, (0, typeorm_1.InjectRepository)(invoice_line_entity_1.InvoiceLine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map