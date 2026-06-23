// src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../commercial/invoices/entities/invoice.entity';
import { Component } from '../components/entities/component.entity';
import { OrderLine } from '../orders/entities/order-line.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import {
  KpiResult,
  MonthlyCaItem,
  TopProductItem,
  StockStatusItem,
  OrdersByStatusItem,
  WarehousePerformanceItem,
  Rolling12MonthItem,
} from './interfaces/analytics.interface';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Component) private componentRepo: Repository<Component>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(OrderLine) private orderLineRepo: Repository<OrderLine>,
    @InjectRepository(InventoryItem) private inventoryRepo: Repository<InventoryItem>,
  ) {}

  // ─── KPIs PRINCIPAUX ──────────────────────────────────────────────
  async getMainKpis(year?: number): Promise<KpiResult> {
    const y = year ?? new Date().getFullYear();
    const start = `${y}-01-01`;
    const end = `${y}-12-31`;

    // ✅ CORRIGÉ: Stock critique avec InventoryItem
    const lowStockCount = await this.inventoryRepo
      .createQueryBuilder('i')
      .innerJoin('i.component', 'c')
      .where('i.quantity <= c.seuilAlerte')
      .andWhere('i.quantity > 0')
      .getCount();

    const [caResult, orderCount, overdueCount, unpaidResult, quoteCount, invoiceCount] =
      await Promise.all([
        // CA réalisé (montants encaissés)
        this.invoiceRepo
          .createQueryBuilder('i')
          .select('COALESCE(SUM(i.amount_paid), 0)', 'ca')
          .where('i.type = :type', { type: 'invoice' })
          .andWhere('i.status IN (:...s)', { s: ['paid', 'partial'] })
          .andWhere('i.created_at BETWEEN :start AND :end', { start, end })
          .getRawOne(),

        // Commandes confirmées
        this.orderRepo.count({ where: { status: 'confirmed' as any } }),

        // Factures overdue
        this.invoiceRepo.count({ where: { status: 'overdue' as any } }),

        // Montant impayé
        this.invoiceRepo
          .createQueryBuilder('i')
          .select('COALESCE(SUM(i.total_ttc - i.amount_paid), 0)', 'unpaid')
          .where('i.status IN (:...s)', { s: ['sent', 'partial', 'overdue'] })
          .getRawOne(),

        // Nb devis de l'année
        this.invoiceRepo
          .createQueryBuilder('i')
          .where('i.type = :t', { t: 'invoice' })
          .andWhere('i.created_at BETWEEN :start AND :end', { start, end })
          .getCount(),

        // Nb factures payées
        this.invoiceRepo.count({
          where: { status: 'paid' as any, type: 'invoice' as any },
        }),
      ]);

    return {
      ca: Number(caResult?.ca ?? 0),
      orderCount: Number(orderCount),
      lowStockCount: Number(lowStockCount),
      overdueInvoiceCount: Number(overdueCount),
      totalUnpaid: Number(unpaidResult?.unpaid ?? 0),
      quoteCount: Number(quoteCount),
      invoiceCount: Number(invoiceCount),
    };
  }

  // ─── CA MENSUEL ──────────────────────────────────────────────────
  async getMonthlyCa(year?: number): Promise<MonthlyCaItem[]> {
    const y = year ?? new Date().getFullYear();
    const rows = await this.invoiceRepo
      .createQueryBuilder('i')
      .select("TO_CHAR(i.created_at, 'MM')", 'month')
      .addSelect('COALESCE(SUM(i.amount_paid), 0)', 'ca')
      .addSelect('COUNT(*)', 'count')
      .where("EXTRACT(YEAR FROM i.created_at) = :y", { y })
      .andWhere('i.type = :type', { type: 'invoice' })
      .andWhere('i.status IN (:...s)', { s: ['paid', 'partial'] })
      .groupBy("TO_CHAR(i.created_at, 'MM')")
      .orderBy("TO_CHAR(i.created_at, 'MM')", 'ASC')
      .getRawMany();

    const LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
      'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    return LABELS.map((label, i) => {
      const m = String(i + 1).padStart(2, '0');
      const row = rows.find((r) => r.month === m);
      return {
        month: label,
        ca: Number(row?.ca ?? 0),
        count: Number(row?.count ?? 0),
      };
    });
  }

  // ─── TOP PRODUITS ─────────────────────────────────────────────────
  async getTopProducts(limit = 10, year?: number): Promise<TopProductItem[]> {
    const y = year ?? new Date().getFullYear();
    const qb = this.orderLineRepo
      .createQueryBuilder('ol')
      .innerJoin('ol.order', 'o')
      .innerJoin('ol.product', 'p')
      .select('p.id', 'productId')
      .addSelect('p.nom', 'name')
      .addSelect('p.reference', 'reference')
      .addSelect('COALESCE(SUM(ol.quantity), 0)', 'totalQty')
      .addSelect('COALESCE(SUM(ol.total_ht), 0)', 'totalHt')
      .where('o.status NOT IN (:...excluded)', { excluded: ['draft', 'cancelled'] })
      .andWhere("EXTRACT(YEAR FROM o.created_at) = :y", { y })
      .groupBy('p.id, p.nom, p.reference')
      .orderBy('SUM(ol.quantity)', 'DESC')
      .limit(limit);

    const rows = await qb.getRawMany();
    return rows.map((r) => ({
      productId: Number(r.productId),
      name: r.name,
      reference: r.reference,
      totalQty: Number(r.totalQty),
      totalHt: Number(r.totalHt),
    }));
  }

  // ─── ÉTAT STOCK COMPOSANTS (CORRIGÉ) ─────────────────────────────
  async getStockStatus(): Promise<StockStatusItem[]> {
    // ✅ CORRIGÉ: Récupérer le stock depuis InventoryItem
    const components = await this.componentRepo
      .createQueryBuilder('c')
      .leftJoin('c.inventoryItems', 'i')
      .addSelect('COALESCE(SUM(i.quantity), 0)', 'totalQuantity')
      .groupBy('c.id')
      .orderBy('COALESCE(SUM(i.quantity), 0)', 'ASC')
      .getMany();

    return components.map((c: any) => {
      const qty = Number(c.totalQuantity) || 0;
      const min = Number(c.seuilAlerte);
      const status =
        qty <= 0 ? 'rupture' :
          qty <= min ? 'critique' :
            qty <= min * 1.5 ? 'faible' : 'normal';

      return {
        id: c.id,
        name: c.nom,
        reference: c.reference,
        quantiteDisponible: qty,
        stockMinimum: min,
        prixAchat: Number(c.prixAchat),
        status,
      };
    });
  }

  // ─── COMMANDES PAR STATUT ─────────────────────────────────────────
  async getOrdersByStatus(): Promise<OrdersByStatusItem[]> {
    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(o.total_ttc), 0)', 'total')
      .groupBy('o.status')
      .getRawMany();

    return rows.map((r) => ({
      status: r.status,
      count: Number(r.count),
      total: Number(r.total),
    }));
  }

  // ─── PERFORMANCE ENTREPÔTS (CORRIGÉ) ─────────────────────────────
  async getWarehousePerformance(): Promise<WarehousePerformanceItem[]> {
    // ✅ CORRIGÉ: Utiliser InventoryItem pour le stock
    const rows = await this.inventoryRepo
      .createQueryBuilder('i')
      .innerJoin('i.warehouse', 'w')
      .innerJoin('i.component', 'c')
      .select('w.id', 'warehouseId')
      .addSelect('w.nom', 'warehouseName')
      .addSelect('COUNT(DISTINCT i.component_id)', 'componentCount')
      .addSelect(
        'COALESCE(SUM(i.quantity * c.prixAchat), 0)',
        'stockValue',
      )
      .groupBy('w.id, w.nom')
      .orderBy('SUM(i.quantity * c.prixAchat)', 'DESC')
      .getRawMany();

    return rows.map((r) => ({
      warehouseId: Number(r.warehouseId),
      warehouseName: r.warehouseName,
      componentCount: Number(r.componentCount),
      stockValue: Number(r.stockValue),
    }));
  }

  // ─── CA GLISSANT 12 MOIS ──────────────────────────────────────────
  async getRolling12Months(): Promise<Rolling12MonthItem[]> {
    const rows = await this.invoiceRepo
      .createQueryBuilder('i')
      .select("TO_CHAR(DATE_TRUNC('month', i.created_at), 'YYYY-MM')", 'month')
      .addSelect('COALESCE(SUM(i.amount_paid), 0)', 'ca')
      .where("i.created_at >= NOW() - INTERVAL '12 months'")
      .andWhere('i.type = :type', { type: 'invoice' })
      .andWhere('i.status IN (:...s)', { s: ['paid', 'partial'] })
      .groupBy("DATE_TRUNC('month', i.created_at)")
      .orderBy("DATE_TRUNC('month', i.created_at)", 'ASC')
      .getRawMany();

    return rows.map((r) => ({
      month: r.month,
      ca: Number(r.ca),
    }));
  }
}