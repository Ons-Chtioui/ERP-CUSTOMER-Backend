// src/emails/emails.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { EmailLog, EmailStatus } from './entities/email-log.entity';

// ── Interfaces ────────────────────────────────────────────────
export interface EmailEvent {
  logId:        number;
  status:       EmailStatus | 'sending';
  toEmail:      string;
  subject:      string;
  template?:    string;
  relatedType?: string;
  relatedId?:   number;
  error?:       string;
  sentAt?:      Date;
  createdAt?:   Date;
}

export interface SendEmailOptions {
  to:            string;
  toName?:       string;
  subject:       string;
  template:      string;
  context:       Record<string, any>;
  relatedType?:  string;
  relatedId?:    number;
  createdBy?:    number;
  attachments?:  Array<{
    filename:    string;
    content:     Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    @InjectRepository(EmailLog) private logRepo: Repository<EmailLog>,
    private readonly mailerService: MailerService,
    @InjectQueue('emails') private emailQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ── Émettre un événement SSE ──────────────────────────────────
  emitEmailEvent(event: EmailEvent): void {
    this.eventEmitter.emit('email.status', event);
    this.logger.log(`[SSE] ${event.status} → ${event.toEmail}`);
  }

  // ── Observable SSE (un flux par connexion client) ─────────────
  getEmailStream(): Observable<MessageEvent> {
    return new Observable((subscriber) => {
      const handler = (event: EmailEvent) => {
        subscriber.next({
          data:  JSON.stringify(event),
          type:  'email.status',
          id:    String(event.logId),
          retry: 3000,
        } as MessageEvent);
      };

      this.eventEmitter.on('email.status', handler);

      const ping = setInterval(() => {
        try {
          subscriber.next({ data: 'ping', type: 'ping' } as MessageEvent);
        } catch {
          clearInterval(ping);
        }
      }, 20_000);

      return () => {
        this.eventEmitter.off('email.status', handler);
        clearInterval(ping);
        this.logger.log('[SSE] Client déconnecté');
      };
    });
  }

  // ── Envoi IMMÉDIAT avec suivi temps réel ─────────────────────
  async sendNow(opts: SendEmailOptions): Promise<EmailLog> {
    const log = await this.logRepo.save(
      this.logRepo.create({
        toEmail:     opts.to,
        toName:      opts.toName     ?? null,
        subject:     opts.subject,
        template:    opts.template,
        relatedType: opts.relatedType ?? null,
        relatedId:   opts.relatedId   ?? null,
        createdBy:   opts.createdBy   ?? null,
        status:      EmailStatus.PENDING,
      }),
    );

    this.emitEmailEvent({
      logId:       log.id,
      status:      EmailStatus.PENDING,
      toEmail:     opts.to,
      subject:     opts.subject,
      template:    opts.template,
      relatedType: opts.relatedType,
      relatedId:   opts.relatedId,
      createdAt:   new Date(),
    });

    try {
      log.status = EmailStatus.SENDING;
      await this.logRepo.save(log);
      this.emitEmailEvent({
        logId:   log.id,
        status:  EmailStatus.SENDING,
        toEmail: opts.to,
        subject: opts.subject,
      });

      await this.mailerService.sendMail({
        to:          opts.toName ? `${opts.toName} <${opts.to}>` : opts.to,
        subject:     opts.subject,
        template:    opts.template,
        context:     opts.context,
        attachments: opts.attachments,
      });

      log.status = EmailStatus.SENT;
      log.sentAt = new Date();
      await this.logRepo.save(log);

      this.emitEmailEvent({
        logId:   log.id,
        status:  EmailStatus.SENT,
        toEmail: opts.to,
        subject: opts.subject,
        sentAt:  log.sentAt,
      });

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : String(error);
      
      this.logger.error(`Échec envoi ${opts.to}: ${errorMessage}`);
      log.status = EmailStatus.FAILED;
      log.error  = errorMessage;
      await this.logRepo.save(log);

      this.emitEmailEvent({
        logId:   log.id,
        status:  EmailStatus.FAILED,
        toEmail: opts.to,
        subject: opts.subject,
        error:   errorMessage,
      });
    }

    return log;
  }

  // ── Envoi ASYNCHRONE via Bull Queue ──────────────────────────
  async sendQueued(opts: SendEmailOptions): Promise<{ logId: number; jobId: string | number }> {
    const log = await this.logRepo.save(
      this.logRepo.create({
        toEmail:     opts.to,
        toName:      opts.toName     ?? null,
        subject:     opts.subject,
        template:    opts.template,
        relatedType: opts.relatedType ?? null,
        relatedId:   opts.relatedId   ?? null,
        createdBy:   opts.createdBy   ?? null,
        status:      EmailStatus.PENDING,
      }),
    );

    const job = await this.emailQueue.add('send', { ...opts, logId: log.id }, {
      attempts:          3,
      backoff:           { type: 'exponential', delay: 5000 },
      removeOnComplete:  true,
      removeOnFail:      false,
    });

    this.emitEmailEvent({
      logId:       log.id,
      status:      EmailStatus.PENDING,
      toEmail:     opts.to,
      subject:     opts.subject,
      template:    opts.template,
      relatedType: opts.relatedType,
      relatedId:   opts.relatedId,
      createdAt:   new Date(),
    });

    return { logId: log.id, jobId: job.id };
  }

  // ── Renvoyer un email échoué ──────────────────────────────────
  async resend(logId: number): Promise<{ logId: number; jobId: string | number }> {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log) throw new Error(`EmailLog #${logId} introuvable`);

    return this.sendQueued({
      to:          log.toEmail,
      toName:      log.toName    ?? undefined,
      subject:     log.subject,
      template:    log.template,
      relatedType: log.relatedType ?? undefined,
      relatedId:   log.relatedId   ?? undefined,
      context:     {},
    });
  }

  // ── Helpers métier ────────────────────────────────────────────

  /**
   * Envoie le devis par email, avec PDF en pièce jointe.
   * FIX (Bug #4 audit) : accepte maintenant pdfBuffer en paramètre pour
   * réutiliser le PDF déjà généré par DocumentsService.generateQuotePdf(),
   * au lieu d'avoir deux systèmes d'email déconnectés (queue/log/SSE manquants
   * côté DocumentsService.sendQuoteEmail() avant correction).
   */
  async sendQuoteEmail(quote: any, pdfBuffer?: Buffer, userId?: number): Promise<void> {
    const attachments = pdfBuffer
      ? [{
          filename:    `${quote.reference}.pdf`,
          content:     pdfBuffer,
          contentType: 'application/pdf',
        }]
      : undefined;

    await this.sendNow({
      to:       quote.client.email,
      toName:   quote.client.name,
      subject:  `Devis ${quote.reference} — ${process.env.COMPANY_NAME ?? 'ERP'}`,
      template: 'quote',
      context: {
        reference:   quote.reference,
        clientName:  quote.client.name,
        validUntil:  new Date(quote.validUntil).toLocaleDateString('fr-FR'),
        lines:       quote.lines.map((l: any) => ({
          productName: l.product?.nom ?? l.description ?? '',
          quantity:    l.quantity,
          unitPrice:   Number(l.unitPrice).toFixed(3),
          totalHt:     Number(l.totalHt).toFixed(3),
        })),
        totalHt:     Number(quote.totalHt).toFixed(3),
        totalTva:    Number(quote.totalTva).toFixed(3),
        totalTtc:    Number(quote.totalTtc).toFixed(3),
        note:        quote.note ?? null,
        companyName: process.env.COMPANY_NAME    ?? 'Mon ERP',
        companyAddress: process.env.COMPANY_ADDRESS ?? '',
        quoteUrl:    `${process.env.APP_URL}/quotes/${quote.id}`,
      },
      attachments,
      relatedType: 'quote',
      relatedId:   quote.id,
      createdBy:   userId,
    });
  }

  async sendInvoiceEmail(
    invoice: any,
    pdfBuffer?: Buffer,
    userId?: number,
  ): Promise<void> {
    const attachments = pdfBuffer
      ? [{
          filename:    `${invoice.reference}.pdf`,
          content:     pdfBuffer,
          contentType: 'application/pdf',
        }]
      : undefined;

    await this.sendNow({
      to:       invoice.client.email,
      toName:   invoice.client.name,
      subject:  `Facture ${invoice.reference} — ${process.env.COMPANY_NAME ?? 'ERP'}`,
      template: 'invoice',
      context: {
        reference:   invoice.reference,
        clientName:  invoice.client.name,
        dueDate:     invoice.dueDate
                       ? new Date(invoice.dueDate).toLocaleDateString('fr-FR')
                       : null,
        lines:       invoice.lines.map((l: any) => ({
          description: l.description,
          quantity:    l.quantity,
          unitPrice:   Number(l.unitPrice).toFixed(3),
          totalHt:     Number(l.totalHt).toFixed(3),
        })),
        totalHt:     Number(invoice.totalHt).toFixed(3),
        totalTva:    Number(invoice.totalTva).toFixed(3),
        totalTtc:    Number(invoice.totalTtc).toFixed(3),
        companyName: process.env.COMPANY_NAME ?? 'Mon ERP',
        isReminder:  false,
      },
      attachments,
      relatedType: 'invoice',
      relatedId:   invoice.id,
      createdBy:   userId,
    });
  }

  /**
   * NOUVEAU (Bug #4 audit) — envoi du bon de livraison par email.
   * Manquait dans EmailsService ; DocumentsService.sendDeliveryNoteEmail()
   * appelait mailer.sendMail() directement, sans queue/log/SSE.
   */
  async sendDeliveryNoteEmail(
    deliveryNote: any,
    pdfBuffer?: Buffer,
    userId?: number,
  ): Promise<void> {
    const attachments = pdfBuffer
      ? [{
          filename:    `${deliveryNote.reference}.pdf`,
          content:     pdfBuffer,
          contentType: 'application/pdf',
        }]
      : undefined;

    await this.sendNow({
      to:       deliveryNote.client.email,
      toName:   deliveryNote.client.name,
      subject:  `Bon de livraison ${deliveryNote.reference} — ${process.env.COMPANY_NAME ?? 'ERP'}`,
      template: 'delivery-note',
      context: {
        reference:    deliveryNote.reference,
        clientName:   deliveryNote.client.name,
        status:       deliveryNote.status,
        deliveredAt:  deliveryNote.deliveredAt
                        ? new Date(deliveryNote.deliveredAt).toLocaleDateString('fr-FR')
                        : null,
        companyName:  process.env.COMPANY_NAME ?? 'Mon ERP',
      },
      attachments,
      relatedType: 'delivery_note',
      relatedId:   deliveryNote.id,
      createdBy:   userId,
    });
  }

  async sendOverdueReminder(invoice: any): Promise<void> {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    const amountDue = (Number(invoice.totalTtc) - Number(invoice.amountPaid)).toFixed(3);

    await this.sendQueued({
      to:       invoice.client.email,
      toName:   invoice.client.name,
      subject:  `⚠️ Rappel paiement — Facture ${invoice.reference}`,
      template: 'invoice',
      context: {
        reference:   invoice.reference,
        clientName:  invoice.client.name,
        dueDate:     new Date(invoice.dueDate).toLocaleDateString('fr-FR'),
        daysOverdue,
        amountDue,
        companyName: process.env.COMPANY_NAME ?? 'Mon ERP',
        isReminder:  true,
        lines:       invoice.lines?.map((l: any) => ({
          description: l.description,
          quantity:    l.quantity,
          unitPrice:   Number(l.unitPrice).toFixed(3),
          totalHt:     Number(l.totalHt).toFixed(3),
        })) ?? [],
        totalHt:   Number(invoice.totalHt).toFixed(3),
        totalTva:  Number(invoice.totalTva).toFixed(3),
        totalTtc:  Number(invoice.totalTtc).toFixed(3),
      },
      relatedType: 'invoice',
      relatedId:   invoice.id,
    });
  }

  /**
   * FIX (Bug #2 audit) : accepte désormais les objets retournés par la requête
   * SQL corrigée de StockAlertsService/EmailSchedulerService — qui exposent
   * stockTotal/seuilAlerte (et plus quantiteDisponible/stockMinimum qui
   * n'existent pas sur l'entité Component). On garde un fallback pour rester
   * compatible avec d'éventuels appels existants.
   */
  async sendStockAlert(components: any[], recipientEmail: string): Promise<void> {
    await this.sendQueued({
      to:       recipientEmail,
      subject:  `⚠️ Alerte stock — ${components.length} composant(s) critique(s)`,
      template: 'stock-alert',
      context: {
        components: components.map((c) => ({
          name:      c.nom ?? c.name,
          reference: c.reference,
          stock:     c.stockTotal   ?? c.quantiteDisponible,
          minimum:   c.seuilAlerte  ?? c.stockMinimum,
          isRupture: Number(c.stockTotal ?? c.quantiteDisponible ?? 0) <= 0,
        })),
        companyName: process.env.COMPANY_NAME ?? 'Mon ERP',
      },
      relatedType: 'alert',
    });
  }

  // ── Historique ────────────────────────────────────────────────
  async getLogs(params?: {
    relatedType?: string;
    relatedId?:   number;
    status?:      string;
    limit?:       number;
  }) {
    const qb = this.logRepo
      .createQueryBuilder('el')
      .leftJoinAndSelect('el.creator', 'creator')
      .orderBy('el.created_at', 'DESC')
      .take(params?.limit ?? 50);

    if (params?.relatedType) {
      qb.andWhere('el.related_type = :t', { t: params.relatedType });
    }
    if (params?.relatedId) {
      qb.andWhere('el.related_id = :id', { id: params.relatedId });
    }
    if (params?.status) {
      qb.andWhere('el.status = :status', { status: params.status });
    }

    return qb.getMany();
  }
}