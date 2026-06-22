import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Invoice, InvoiceStatus, InvoiceType } from '../commercial/invoices/entities/invoice.entity';
import { Quote, QuoteStatus } from '../commercial/quotes/entities/quote.entity';
import { StockAlert } from '../stock-alerts/entities/stock-alert.entity';
import { Warehouse } from '../warehouses/entities/warehouse.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { OrderLine } from '../orders/entities/order-line.entity';
import { InvoiceLine } from '../commercial/invoices/entities/invoice-line.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Quote) private quoteRepo: Repository<Quote>,
    @InjectRepository(StockAlert) private alertRepo: Repository<StockAlert>,
    @InjectRepository(Warehouse) private warehouseRepo: Repository<Warehouse>,
    @InjectRepository(InventoryItem) private invItemRepo: Repository<InventoryItem>,
    @InjectRepository(OrderLine) private orderLineRepo: Repository<OrderLine>,
    @InjectRepository(InvoiceLine) private invoiceLineRepo: Repository<InvoiceLine>,
  ) {}

  async getAnalytics() {
    const [
      revenueRow,
      orderStats,
      invoiceStats,
      quoteStats,
      topProducts,
      alerts,
      warehousePerf,
      monthlyRevenue,
    ] = await Promise.all([
      this.invoiceRepo
        .createQueryBuilder('i')
        .select('COALESCE(SUM(i.amount_paid), 0)', 'paid')
        .addSelect('COALESCE(SUM(i.total_ttc - i.amount_paid), 0)', 'unpaid')
        .where('i.type = :type', { type: InvoiceType.INVOICE })
        .andWhere('i.status != :cancelled', { cancelled: InvoiceStatus.CANCELLED })
        .getRawOne() as Promise<{ paid: string; unpaid: string }>,

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
        .where('i.type = :type', { type: InvoiceType.INVOICE })
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
            id:    w.id,
            name:  w.nom,
            code:  w.code,
            items: items.length,
            value: items.reduce(
              (s, i) => s + Number(i.quantity) * Number(i.component?.prixAchat ?? 0), 0,
            ),
          };
        }));
      }),

      this.invoiceRepo
        .createQueryBuilder('i')
        .select("TO_CHAR(i.created_at, 'YYYY-MM')", 'month')
        .addSelect('COALESCE(SUM(i.amount_paid), 0)', 'revenue')
        .where('i.type = :type', { type: InvoiceType.INVOICE })
        .groupBy("TO_CHAR(i.created_at, 'YYYY-MM')")
        .orderBy("TO_CHAR(i.created_at, 'YYYY-MM')", 'ASC')
        .limit(12)
        .getRawMany(),
    ]);

    const quotesTotal = quoteStats.reduce((s, r) => s + Number(r.count), 0);
    const quotesConverted = quoteStats.find(r => r.status === QuoteStatus.CONVERTED)?.count ?? 0;

    return {
      revenue: {
        paid:   Number(revenueRow?.paid ?? 0),
        unpaid: Number(revenueRow?.unpaid ?? 0),
      },
      orders: {
        byStatus: orderStats.map(r => ({
          status: r.status,
          count:  Number(r.count),
          total:  Number(r.total),
        })),
        delivered: orderStats.find(r => r.status === OrderStatus.DELIVERED)?.count ?? 0,
      },
      invoices: {
        byStatus: invoiceStats.map(r => ({
          status: r.status,
          count:  Number(r.count),
          total:  Number(r.total),
        })),
        overdue: invoiceStats.find(r => r.status === InvoiceStatus.OVERDUE)?.count ?? 0,
      },
      quotes: {
        byStatus: quoteStats.map(r => ({ status: r.status, count: Number(r.count) })),
        conversionRate: quotesTotal > 0
          ? Math.round((Number(quotesConverted) / quotesTotal) * 100)
          : 0,
      },
      topProducts: topProducts.map(p => ({
        name:     p.name,
        reference: p.reference,
        quantity: Number(p.quantity),
        revenue:  Number(p.revenue),
      })),
      stockAlerts: alerts.map(a => ({
        id:        a.id,
        component: a.component?.nom,
        warehouse: a.warehouse?.nom,
        quantity:  a.quantityAtAlert,
        threshold: a.threshold,
      })),
      warehouses: warehousePerf.map(w => ({
        id:    w.id,
        name:  w.name,
        code:  w.code,
        items: w.items,
        value: Math.round(w.value * 100) / 100,
      })),
      monthlyRevenue: monthlyRevenue.map(m => ({
        month:   m.month,
        revenue: Number(m.revenue),
      })),
    };
  }

  /** Export CSV pour Excel */
  async exportCsv(type: 'dashboard' | 'orders' | 'invoices'): Promise<string> {
    if (type === 'orders') {
      const orders = await this.orderRepo.find({ relations: { client: true } });
      const header = 'Reference;Client;Statut;Total TTC;Date\n';
      const rows = orders.map(o =>
        `${o.reference};${o.client?.name};${o.status};${o.totalTtc};${o.createdAt.toISOString()}`,
      ).join('\n');
      return header + rows;
    }
    if (type === 'invoices') {
      const invoices = await this.invoiceRepo.find({ relations: { client: true } });
      const header = 'Reference;Client;Type;Statut;Total TTC;Paye;Date\n';
      const rows = invoices.map(i =>
        `${i.reference};${i.client?.name};${i.type};${i.status};${i.totalTtc};${i.amountPaid};${i.createdAt.toISOString()}`,
      ).join('\n');
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
}
