// src/analytics/export.service.ts
import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { AnalyticsService } from './analytics.service';

const HEADER_COLOR = '2E7D32';
const WHITE = 'FFFFFFFF';

function styleHeader(ws: ExcelJS.Worksheet, columns: { header: string; key: string; width: number }[]) {
  ws.columns = columns;
  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_COLOR } };
    cell.font = { bold: true, color: { argb: WHITE } };
    cell.border = {
      bottom: { style: 'thin', color: { argb: '1B5E20' } },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  headerRow.height = 22;
}

@Injectable()
export class ExportService {
  constructor(private readonly analytics: AnalyticsService) {}

  // ── Export CA mensuel ─────────────────────────────────────────
  async exportMonthlyCaExcel(year: number): Promise<Buffer> {
    const data = await this.analytics.getMonthlyCa(year);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`CA ${year}`);

    styleHeader(ws, [
      { header: 'Mois', key: 'month', width: 12 },
      { header: 'CA (TND)', key: 'ca', width: 18 },
      { header: 'Nb Factures', key: 'count', width: 14 },
    ]);

    data.forEach((row, i) => {
      const r = ws.addRow({
        month: row.month,
        ca: Number(row.ca).toFixed(3),
        count: row.count,
      });
      if (i % 2 === 1) {
        r.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F8F1' } };
        });
      }
    });

    // Ligne total
    const totalRow = ws.addRow({
      month: 'TOTAL',
      ca: data.reduce((s, r) => s + r.ca, 0).toFixed(3),
      count: data.reduce((s, r) => s + r.count, 0),
    });
    totalRow.font = { bold: true };
    totalRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
    });

    // ✅ CORRIGÉ: Utiliser await
    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ── Export top produits ───────────────────────────────────────
  async exportTopProductsExcel(year: number): Promise<Buffer> {
    const data = await this.analytics.getTopProducts(50, year);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Top Produits');

    styleHeader(ws, [
      { header: 'Produit', key: 'name', width: 32 },
      { header: 'Référence', key: 'reference', width: 16 },
      { header: 'Qté vendue', key: 'totalQty', width: 14 },
      { header: 'CA HT (TND)', key: 'totalHt', width: 18 },
    ]);

    data.forEach((row, i) => {
      const r = ws.addRow({
        name: row.name,
        reference: row.reference,
        totalQty: Number(row.totalQty).toFixed(3),
        totalHt: Number(row.totalHt).toFixed(3),
      });
      if (i % 2 === 1) {
        r.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F1F8F1' } };
        });
      }
    });

    // ✅ CORRIGÉ: Utiliser await
    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ── Export dashboard complet ──────────────────────────────────
  async exportFullDashboardExcel(year: number): Promise<Buffer> {
    const [kpis, monthlyCa, topProducts, stockStatus, ordersByStatus] =
      await Promise.all([
        this.analytics.getMainKpis(year),
        this.analytics.getMonthlyCa(year),
        this.analytics.getTopProducts(20, year),
        this.analytics.getStockStatus(),
        this.analytics.getOrdersByStatus(),
      ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ERP System';
    wb.created = new Date();

    // ── Onglet KPIs ──
    const wsKpis = wb.addWorksheet('KPIs');
    styleHeader(wsKpis, [
      { header: 'Indicateur', key: 'label', width: 30 },
      { header: 'Valeur', key: 'value', width: 20 },
    ]);
    [
      { label: `CA réalisé ${year}`, value: `${kpis.ca.toFixed(3)} TND` },
      { label: 'Commandes confirmées', value: kpis.orderCount },
      { label: 'Composants stock critique', value: kpis.lowStockCount },
      { label: 'Factures en retard', value: kpis.overdueInvoiceCount },
      { label: 'Montant impayé total', value: `${kpis.totalUnpaid.toFixed(3)} TND` },
    ].forEach((row) => wsKpis.addRow(row));

    // ── Onglet CA mensuel ──
    const wsCa = wb.addWorksheet(`CA ${year}`);
    styleHeader(wsCa, [
      { header: 'Mois', key: 'month', width: 12 },
      { header: 'CA (TND)', key: 'ca', width: 18 },
      { header: 'Nb Factures', key: 'count', width: 14 },
    ]);
    monthlyCa.forEach((r) =>
      wsCa.addRow({ month: r.month, ca: r.ca.toFixed(3), count: r.count }),
    );

    // ── Onglet Top Produits ──
    const wsTop = wb.addWorksheet('Top Produits');
    styleHeader(wsTop, [
      { header: 'Produit', key: 'name', width: 30 },
      { header: 'Référence', key: 'ref', width: 16 },
      { header: 'Qté', key: 'qty', width: 12 },
      { header: 'CA HT', key: 'ca', width: 18 },
    ]);
    topProducts.forEach((r) =>
      wsTop.addRow({
        name: r.name,
        ref: r.reference,
        qty: Number(r.totalQty).toFixed(3),
        ca: Number(r.totalHt).toFixed(3),
      }),
    );

    // ── Onglet Stock ──
    const wsStock = wb.addWorksheet('État Stock');
    styleHeader(wsStock, [
      { header: 'Composant', key: 'name', width: 30 },
      { header: 'Référence', key: 'ref', width: 16 },
      { header: 'Stock', key: 'qty', width: 12 },
      { header: 'Minimum', key: 'min', width: 12 },
      { header: 'État', key: 'state', width: 12 },
    ]);
    
    const colorMap: Record<string, string> = {
      rupture: 'FFEE9090',
      critique: 'FFFD9B50',
      faible: 'FFFFD966',
      normal: 'FF90C978',
    };
    
    stockStatus.forEach((c) => {
      const row = wsStock.addRow({
        name: c.name,
        ref: c.reference,
        qty: c.quantiteDisponible,
        min: c.stockMinimum,
        state: c.status,
      });
      const stateCell = row.getCell('state');
      stateCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colorMap[c.status] ?? 'FFFFFFFF' },
      };
    });

    // ── Onglet Commandes ──
    const wsOrders = wb.addWorksheet('Commandes');
    styleHeader(wsOrders, [
      { header: 'Statut', key: 'status', width: 16 },
      { header: 'Nb commandes', key: 'count', width: 16 },
      { header: 'Total TTC', key: 'total', width: 18 },
    ]);
    ordersByStatus.forEach((r) =>
      wsOrders.addRow({
        status: r.status,
        count: r.count,
        total: Number(r.total).toFixed(3),
      }),
    );

    // ✅ CORRIGÉ: Utiliser await
    const buffer = await wb.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}