// src/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  /**
   * Récupérer les notifications de l'utilisateur connecté
   */
  @Get()
  findAll(
    @Request() req: any,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.findForUser(req.user.id, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? Number(limit) : 50,
      offset: offset ? Number(offset) : 0,
    });
  }

  /**
   * Nombre de notifications non lues
   */
  @Get('count')
  getCount(@Request() req: any) {
    return this.service.getUnreadCount(req.user.id).then((count) => ({ count }));
  }

  /**
   * Marquer une notification comme lue
   */
  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markRead(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    await this.service.markRead(id, req.user.id);
  }

  /**
   * Marquer toutes les notifications comme lues
   */
  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markAllRead(@Request() req: any) {
    await this.service.markAllRead(req.user.id);
  }

  /**
   * Supprimer une notification
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    await this.service.delete(id, req.user.id);
  }
}