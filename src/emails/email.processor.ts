// ============================================================
// src/emails/email.processor.ts
// ============================================================
import {
  Process, Processor,
  OnQueueActive, OnQueueCompleted, OnQueueFailed,
} from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { EmailLog, EmailStatus } from './entities/email-log.entity';
import { EmailsService } from './emails.service';

@Processor('emails')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    @InjectRepository(EmailLog) private logRepo: Repository<EmailLog>,
    private readonly mailerService: MailerService,
    private readonly emailsService: EmailsService,
  ) {}

  // ── Job activé (début du traitement) ─────────────────────────
  @OnQueueActive()
  async onActive(job: Job) {
    const { logId, to, subject } = job.data;
    this.logger.log(`[Queue] Processing job #${job.id} → ${to}`);

    if (logId) {
      await this.logRepo.update(logId, { status: EmailStatus.SENDING });
      this.emailsService.emitEmailEvent({
        logId,
        status:  EmailStatus.SENDING,
        toEmail: to,
        subject,
      });
    }
  }

  // ── Traitement du job ─────────────────────────────────────────
  @Process('send')
  async handleSend(job: Job) {
    const { to, toName, subject, template, context, attachments } = job.data;

    this.logger.log(`[Queue] Sending email to ${to} (template: ${template})`);

    await this.mailerService.sendMail({
      to:          toName ? `${toName} <${to}>` : to,
      subject,
      template,
      context:     context ?? {},
      attachments,
    });
    // Succès → géré par @OnQueueCompleted
  }

  // ── Job terminé avec succès ───────────────────────────────────
  @OnQueueCompleted()
  async onCompleted(job: Job) {
    const { logId, to, subject } = job.data;
    const sentAt = new Date();

    if (logId) {
      await this.logRepo.update(logId, {
        status: EmailStatus.SENT,
        sentAt,
      });
      this.emailsService.emitEmailEvent({
        logId,
        status:  EmailStatus.SENT,
        toEmail: to,
        subject,
        sentAt,
      });
    }
    this.logger.log(`[Queue] ✓ Email envoyé à ${to}`);
  }

  // ── Job échoué (après tous les retries) ──────────────────────
  @OnQueueFailed()
  async onFailed(job: Job, error: Error) {
    const { logId, to, subject } = job.data;
    const maxAttempts = job.opts.attempts ?? 3;
    const isLastAttempt = job.attemptsMade >= maxAttempts;

    this.logger.error(
      `[Queue] ✗ Échec job #${job.id} (tentative ${job.attemptsMade}/${maxAttempts}): ${error.message}`,
    );

    // N'émettre FAILED que sur la dernière tentative
    if (isLastAttempt && logId) {
      await this.logRepo.update(logId, {
        status: EmailStatus.FAILED,
        error:  error.message,
      });
      this.emailsService.emitEmailEvent({
        logId,
        status:  EmailStatus.FAILED,
        toEmail: to,
        subject,
        error:   error.message,
      });
    }
  }
}