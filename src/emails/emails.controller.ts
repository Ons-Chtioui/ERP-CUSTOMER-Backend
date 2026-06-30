// src/emails/emails.controller.ts
import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Sse,
  MessageEvent,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { EmailsService } from './emails.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('emails')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmailsController {
  constructor(private readonly service: EmailsService) {}

  /**
   * SSE endpoint — flux temps réel pour les emails
   */
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return this.service.getEmailStream();
  }

  /**
   * Historique des emails
   */
  @Get('logs')
  @RequirePermission('emails.read')
  getLogs(
    @Query('limit') limit?: string,
    @Query('relatedId') relatedId?: string,
    @Query('relatedType') relatedType?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getLogs({
      limit: limit ? Number(limit) : 50,
      relatedId: relatedId ? Number(relatedId) : undefined,
      relatedType,
      status,
    });
  }

  /**
   * Renvoyer un email échoué
   */
  @Post('resend/:logId')
  @RequirePermission('emails.create')
  @HttpCode(HttpStatus.OK)
  async resend(@Param('logId', ParseIntPipe) logId: number) {
    const result = await this.service.resend(logId);
    return { logId: result.logId, jobId: result.jobId };
  }
}