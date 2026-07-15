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
  /** HTML à envoyer — généré par les helpers métier */
  html:          string;
  template?:     string; // conservé pour logs
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
        html:        opts.html,       // FIX Bug #6: stocker le HTML pour resend()
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
        html:        opts.html,
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
        html:        opts.html,       // FIX Bug #6: stocker le HTML pour resend()
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
  // FIX Bug #6: resend() utilise log.html au lieu d'un context:{} invalide
  async resend(logId: number): Promise<{ logId: number; jobId: string | number }> {
    const log = await this.logRepo.findOne({ where: { id: logId } });
    if (!log) throw new Error(`EmailLog #${logId} introuvable`);
    if (!log.html) throw new Error(`EmailLog #${logId} : HTML manquant, impossible de renvoyer`);

    return this.sendQueued({
      to:          log.toEmail,
      toName:      log.toName    ?? undefined,
      subject:     log.subject,
      html:        log.html,
      template:    log.template,
      relatedType: log.relatedType ?? undefined,
      relatedId:   log.relatedId   ?? undefined,
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
      ? [{ filename: `${quote.reference}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
      : undefined;

    const lines = quote.lines?.map((l: any) => `
      <tr>
        <td>${l.product?.nom ?? l.description ?? ''}</td>
        <td style="text-align:right">${l.quantity}</td>
        <td style="text-align:right">${Number(l.unitPrice).toFixed(3)} TND</td>
        <td style="text-align:right">${Number(l.totalHt).toFixed(3)} TND</td>
      </tr>`).join('') ?? '';

    await this.sendNow({
      to: quote.client.email, toName: quote.client.name,
      subject: `Devis ${quote.reference} — ${process.env.COMPANY_NAME ?? 'ERP'}`,
      template: 'quote',
      html: `<html><body style="font-family:Arial;font-size:14px;color:#1f2937">
        <h2 style="color:#3B4EFF">Devis ${quote.reference}</h2>
        <p>Bonjour <strong>${quote.client.name}</strong>,</p>
        <p>Veuillez trouver votre devis ci-dessous. Valide jusqu'au ${new Date(quote.validUntil).toLocaleDateString('fr-TN')}.</p>
        <table width="100%" cellspacing="0" cellpadding="8" border="1" style="border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#3B4EFF;color:#fff"><th>Désignation</th><th>Qté</th><th>PU HT</th><th>Total HT</th></tr></thead>
          <tbody>${lines}</tbody>
        </table>
        <p><strong>Total HT:</strong> ${Number(quote.totalHt).toFixed(3)} TND &nbsp;|&nbsp;
           <strong>TVA:</strong> ${Number(quote.totalTva).toFixed(3)} TND &nbsp;|&nbsp;
           <strong>Total TTC:</strong> ${Number(quote.totalTtc).toFixed(3)} TND</p>
        <p style="color:#6b7280;font-size:12px">${process.env.COMPANY_NAME ?? 'Mon ERP'}</p>
      </body></html>`,
      attachments, relatedType: 'quote', relatedId: quote.id, createdBy: userId,
    });
  }

  async sendInvoiceEmail(invoice: any, pdfBuffer?: Buffer, userId?: number): Promise<void> {
    const attachments = pdfBuffer
      ? [{ filename: `${invoice.reference}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
      : undefined;

    const lines = invoice.lines?.map((l: any) => `
      <tr>
        <td>${l.description ?? l.product?.nom ?? ''}</td>
        <td style="text-align:right">${l.quantity}</td>
        <td style="text-align:right">${Number(l.unitPrice).toFixed(3)} TND</td>
        <td style="text-align:right">${Number(l.totalHt).toFixed(3)} TND</td>
      </tr>`).join('') ?? '';

    await this.sendNow({
      to: invoice.client.email, toName: invoice.client.name,
      subject: `Facture ${invoice.reference} — ${process.env.COMPANY_NAME ?? 'ERP'}`,
      template: 'invoice',
      html: `<html><body style="font-family:Arial;font-size:14px;color:#1f2937">
        <h2 style="color:#10b981">Facture ${invoice.reference}</h2>
        <p>Bonjour <strong>${invoice.client.name}</strong>,</p>
        <table width="100%" cellspacing="0" cellpadding="8" border="1" style="border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#10b981;color:#fff"><th>Description</th><th>Qté</th><th>PU HT</th><th>Total HT</th></tr></thead>
          <tbody>${lines}</tbody>
        </table>
        <p><strong>Total HT:</strong> ${Number(invoice.totalHt).toFixed(3)} TND &nbsp;|&nbsp;
           <strong>TVA:</strong> ${Number(invoice.totalTva).toFixed(3)} TND &nbsp;|&nbsp;
           <strong>Total TTC:</strong> ${Number(invoice.totalTtc).toFixed(3)} TND</p>
        <p style="color:#6b7280;font-size:12px">${process.env.COMPANY_NAME ?? 'Mon ERP'}</p>
      </body></html>`,
      attachments, relatedType: 'invoice', relatedId: invoice.id, createdBy: userId,
    });
  }

  async sendDeliveryNoteEmail(deliveryNote: any, pdfBuffer?: Buffer, userId?: number): Promise<void> {
    const attachments = pdfBuffer
      ? [{ filename: `${deliveryNote.reference}.pdf`, content: pdfBuffer, contentType: 'application/pdf' }]
      : undefined;

    await this.sendNow({
      to: deliveryNote.client.email, toName: deliveryNote.client.name,
      subject: `Bon de livraison ${deliveryNote.reference} — ${process.env.COMPANY_NAME ?? 'ERP'}`,
      template: 'delivery-note',
      html: `<html><body style="font-family:Arial;font-size:14px;color:#1f2937">
        <h2>Bon de livraison ${deliveryNote.reference}</h2>
        <p>Bonjour <strong>${deliveryNote.client.name}</strong>,</p>
        <p>Votre commande a été prise en charge. Statut : <strong>${deliveryNote.status}</strong></p>
        <p style="color:#6b7280;font-size:12px">${process.env.COMPANY_NAME ?? 'Mon ERP'}</p>
      </body></html>`,
      attachments, relatedType: 'delivery_note', relatedId: deliveryNote.id, createdBy: userId,
    });
  }

  async sendOverdueReminder(invoice: any): Promise<void> {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    const amountDue = (Number(invoice.totalTtc) - Number(invoice.amountPaid ?? 0)).toFixed(3);

    await this.sendQueued({
      to: invoice.client.email, toName: invoice.client.name,
      subject: `⚠️ Rappel paiement — Facture ${invoice.reference}`,
      template: 'invoice',
      html: `<html><body style="font-family:Arial;font-size:14px;color:#1f2937">
        <h2 style="color:#dc2626">⚠️ Relance de paiement — ${invoice.reference}</h2>
        <p>Bonjour <strong>${invoice.client.name}</strong>,</p>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:14px;margin:16px 0">
          La facture <strong>${invoice.reference}</strong> est en attente depuis <strong>${daysOverdue} jour(s)</strong>.<br>
          Montant dû : <strong>${amountDue} TND</strong>
        </div>
        <p style="color:#6b7280;font-size:12px">${process.env.COMPANY_NAME ?? 'Mon ERP'}</p>
      </body></html>`,
      relatedType: 'invoice', relatedId: invoice.id,
    });
  }

  async sendStockAlert(components: any[], recipientEmail: string): Promise<void> {
    const rows = components.map((c) => `
      <tr>
        <td><strong>${c.nom ?? c.name}</strong></td>
        <td style="font-family:monospace">${c.reference}</td>
        <td style="text-align:right;color:${Number(c.stockTotal ?? c.quantiteDisponible ?? 0) <= 0 ? '#dc2626' : '#d97706'}">
          ${c.stockTotal ?? c.quantiteDisponible}
        </td>
        <td style="text-align:right;color:#6b7280">${c.seuilAlerte ?? c.stockMinimum}</td>
        <td>${Number(c.stockTotal ?? c.quantiteDisponible ?? 0) <= 0 ? 'RUPTURE' : 'CRITIQUE'}</td>
      </tr>`).join('');

    await this.sendQueued({
      to: recipientEmail,
      subject: `⚠️ Alerte stock — ${components.length} composant(s) critique(s)`,
      template: 'stock-alert',
      html: `<html><body style="font-family:Arial;font-size:14px;color:#1f2937">
        <h2 style="color:#dc2626">⚠️ Alerte Stock Critique</h2>
        <p>${components.length} composant(s) nécessitent votre attention :</p>
        <table width="100%" cellspacing="0" cellpadding="8" border="1" style="border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#dc2626;color:#fff">
            <th>Composant</th><th>Référence</th><th>Stock</th><th>Minimum</th><th>État</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="color:#6b7280;font-size:12px">${process.env.COMPANY_NAME ?? 'Mon ERP'} — Alerte automatique.</p>
      </body></html>`,
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