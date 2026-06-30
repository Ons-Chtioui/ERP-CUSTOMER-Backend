// src/notifications/notifications.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  // ─── CRÉER UNE NOTIFICATION ──────────────────────────────────────
  async create(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId,
      type,
      title,
      message,
      link,
      isRead: false,
    });
    return this.notificationRepo.save(notification);
  }

  // ─── CRÉER POUR PLUSIEURS UTILISATEURS ──────────────────────────
  async createForUsers(
    userIds: number[],
    type: NotificationType,
    title: string,
    message: string,
    link?: string,
  ): Promise<Notification[]> {
    const notifications = userIds.map(userId =>
      this.notificationRepo.create({
        userId,
        type,
        title,
        message,
        link,
        isRead: false,
      }),
    );
    return this.notificationRepo.save(notifications);
  }

  // ─── RÉCUPÉRER LES NOTIFICATIONS ────────────────────────────────
  async findForUser(
    userId: number,
    filters?: { unreadOnly?: boolean; limit?: number; offset?: number },
  ): Promise<{ items: Notification[]; total: number; unreadCount: number }> {
    const query = this.notificationRepo.createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC');

    if (filters?.unreadOnly) {
      query.andWhere('n.isRead = :isRead', { isRead: false });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const items = await query.getMany();
    const unreadCount = await this.getUnreadCount(userId);

    return { items, total, unreadCount };
  }

  // ─── COMPTER LES NON LUES ─────────────────────────────────────────
  async getUnreadCount(userId: number): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  // ─── MARQUER COMME LUE ────────────────────────────────────────────
  async markRead(id: number, userId: number): Promise<void> {
    const result = await this.notificationRepo.update(
      { id, userId },
      { isRead: true },
    );
    if (result.affected === 0) {
      throw new NotFoundException(`Notification #${id} non trouvée`);
    }
  }

  // ─── MARQUER TOUTES COMME LUES ────────────────────────────────────
  async markAllRead(userId: number): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  // ─── SUPPRIMER UNE NOTIFICATION ──────────────────────────────────
  async delete(id: number, userId: number): Promise<void> {
    const result = await this.notificationRepo.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Notification #${id} non trouvée`);
    }
  }

  // ─── NOTIFICATIONS SPÉCIFIQUES ────────────────────────────────────

  async notifyStockAlert(
    userIds: number[],
    productName: string,
    stock: number,
    threshold: number,
  ): Promise<Notification[]> {
    return this.createForUsers(
      userIds,
      NotificationType.STOCK_ALERT,
      `⚠️ Alerte stock - ${productName}`,
      `Le stock de "${productName}" est à ${stock} unités (seuil: ${threshold})`,
      '/components',
    );
  }

  async notifyOrderStatusChange(
    userId: number,
    orderReference: string,
    status: string,
  ): Promise<Notification> {
    return this.create(
      userId,
      NotificationType.ORDER_STATUS,
      `📦 Commande ${orderReference}`,
      `La commande ${orderReference} est passée au statut "${status}"`,
      `/orders`,
    );
  }

  async notifyInvoiceDue(
    userId: number,
    invoiceReference: string,
    dueDate: Date,
    amount: number,
  ): Promise<Notification> {
    return this.create(
      userId,
      NotificationType.INVOICE_DUE,
      `📄 Facture ${invoiceReference}`,
      `La facture ${invoiceReference} arrive à échéance le ${dueDate.toLocaleDateString()} (${amount} DTN)`,
      `/invoices`,
    );
  }
}