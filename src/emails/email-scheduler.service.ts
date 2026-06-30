// src/emails/email-scheduler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice, InvoiceStatus } from '../commercial/invoices/entities/invoice.entity';
import { Component } from '../components/entities/component.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { User } from '../users/entities/user.entity';
import { EmailsService } from './emails.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class EmailSchedulerService {
  private readonly logger = new Logger(EmailSchedulerService.name);

  constructor(
    @InjectRepository(Invoice)       private invoiceRepo:   Repository<Invoice>,
    @InjectRepository(Component)     private componentRepo: Repository<Component>,
    @InjectRepository(InventoryItem) private inventoryRepo: Repository<InventoryItem>, // FIX Bug #2
    @InjectRepository(User)          private userRepo:      Repository<User>,
    private readonly emailsService:        EmailsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ── Cron 1 : Factures overdue — 08h00 quotidien ──────────────
  @Cron('0 8 * * *')
  async checkOverdueInvoices(): Promise<void> {
    this.logger.log('[Cron 08h00] Vérification factures en retard...');
    const today = new Date().toISOString().split('T')[0];

    const overdueInvoices = await this.invoiceRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.client', 'client')
      .leftJoinAndSelect('i.lines',  'lines')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL],
      })
      .andWhere('i.due_date < :today', { today })
      .andWhere('i.type = :type', { type: 'invoice' })
      .getMany();

    if (overdueInvoices.length === 0) {
      this.logger.log('[Cron 08h00] Aucune facture en retard.');
      return;
    }

    for (const invoice of overdueInvoices) {
      await this.invoiceRepo.update(invoice.id, { status: InvoiceStatus.OVERDUE });

      if (invoice.client?.email) {
        await this.emailsService.sendOverdueReminder({
          ...invoice,
          status: InvoiceStatus.OVERDUE,
        });
      }
    }

    const comptables = await this.userRepo
      .createQueryBuilder('u')
      .where("u.role IN (:...roles)", {
        roles: ['super_admin', 'admin', 'comptable'],
      })
      .andWhere('u.is_active = true')
      .getMany();

    if (comptables.length > 0) {
      await this.notificationsService.createForUsers(
        comptables.map((u) => u.id),
        NotificationType.INVOICE_DUE,
        '📋 Factures en retard',
        `${overdueInvoices.length} facture(s) sont passées en statut OVERDUE`,
        '/invoices?status=overdue',
      );
    }

    this.logger.log(
      `[Cron 08h00] ${overdueInvoices.length} facture(s) passée(s) en OVERDUE.`,
    );
  }

  // ── Cron 2 : Stock critique — toutes les 4 heures ────────────
  // FIX Bug #2 (audit) : l'ancienne requête interrogeait c.quantite_disponible
  // et c.stock_minimum, qui n'existent PAS sur l'entité Component. Le stock réel
  // vit dans InventoryItem (par entrepôt) et le seuil est c.seuilAlerte.
  @Cron('0 */4 * * *')
  async checkLowStock(): Promise<void> {
    this.logger.log('[Cron 4h] Vérification stock critique...');

    // Stock total par composant (toutes entrepôts confondus), comparé au seuil
    const raw = await this.componentRepo
      .createQueryBuilder('c')
      .leftJoin('c.inventoryItems', 'i')
      .select('c.id',           'id')
      .addSelect('c.nom',       'nom')
      .addSelect('c.reference', 'reference')
      .addSelect('c.seuilAlerte', 'seuilAlerte')
      .addSelect('COALESCE(SUM(i.quantity), 0)', 'stockTotal')
      .groupBy('c.id')
      .having('COALESCE(SUM(i.quantity), 0) <= c.seuilAlerte')
      .andHaving('c.seuilAlerte > 0') // ignore les composants sans seuil défini
      .getRawMany<{
        id: number;
        nom: string;
        reference: string;
        seuilAlerte: string;
        stockTotal: string;
      }>();

    const criticalComponents = raw.map((r) => ({
      id:                 r.id,
      nom:                r.nom,
      reference:          r.reference,
      stockTotal:         Number(r.stockTotal),
      seuilAlerte:        Number(r.seuilAlerte),
      // alias conservés pour compat template stock-alert.hbs existant
      quantiteDisponible: Number(r.stockTotal),
      stockMinimum:       Number(r.seuilAlerte),
    }));

    if (criticalComponents.length === 0) {
      this.logger.log('[Cron 4h] Aucun composant en stock critique.');
      return;
    }

    const managers = await this.userRepo
      .createQueryBuilder('u')
      .where("u.role IN (:...roles)", {
        roles: ['super_admin', 'admin', 'responsable_stock'],
      })
      .andWhere('u.is_active = true')
      .getMany();

    for (const manager of managers) {
      if (manager.email) {
        await this.emailsService.sendStockAlert(criticalComponents, manager.email);
      }
    }

    if (managers.length > 0) {
      await this.notificationsService.createForUsers(
        managers.map((u) => u.id),
        NotificationType.STOCK_ALERT,
        '⚠️ Alerte Stock Critique',
        `${criticalComponents.length} composant(s) en stock critique ou rupture`,
        '/components',
      );
    }

    this.logger.log(
      `[Cron 4h] Alertes stock envoyées pour ${criticalComponents.length} composant(s).`,
    );
  }

  // ── Cron 3 : Rappels échéance J-7 — 09h00 quotidien ─────────
  @Cron('0 9 * * *')
  async sendDueDateReminders(): Promise<void> {
    this.logger.log('[Cron 09h00] Rappels échéance J-7...');

    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const targetDate = in7Days.toISOString().split('T')[0];

    const upcomingInvoices = await this.invoiceRepo
      .createQueryBuilder('i')
      .leftJoinAndSelect('i.client', 'client')
      .leftJoinAndSelect('i.lines',  'lines')
      .where('i.status IN (:...statuses)', {
        statuses: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL],
      })
      .andWhere('i.due_date = :date', { date: targetDate })
      .andWhere('i.type = :type', { type: 'invoice' })
      .getMany();

    for (const invoice of upcomingInvoices) {
      if (invoice.client?.email) {
        await this.emailsService.sendOverdueReminder(invoice);
      }
    }

    this.logger.log(
      `[Cron 09h00] ${upcomingInvoices.length} rappel(s) d'échéance envoyé(s).`,
    );
  }
}