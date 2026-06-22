// ============================================================
// src/commercial/delivery-notes/delivery-notes.controller.ts
// ============================================================
import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
  UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DeliveryNotesService } from './delivery-notes.service';
import { CreateDeliveryNoteDto } from './dto/create-delivery-note.dto';
import { DeliverDto } from './dto/deliver.dto';
import { DeliveryStatus } from './entities/delivery-note.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';

@Controller('delivery-notes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DeliveryNotesController {
  constructor(private readonly service: DeliveryNotesService) {}

  // POST /delivery-notes
  @Post()
  @RequirePermission('delivery.create')
  create(@Body() dto: CreateDeliveryNoteDto, @Request() req: any) {
    return this.service.create(dto, req.user.id);
  }

  // GET /delivery-notes
  @Get()
  @RequirePermission('delivery.view')
  findAll(
    @Query('clientId') clientId?: string,
    @Query('status')   status?:   DeliveryStatus,
  ) {
    return this.service.findAll({
      clientId: clientId ? Number(clientId) : undefined,
      status,
    });
  }

  // GET /delivery-notes/:id
  @Get(':id')
  @RequirePermission('delivery.view')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // PATCH /delivery-notes/:id/deliver
  // Marque le BL comme DELIVERED ou SIGNED (si signatureUrl fourni)
  @Patch(':id/deliver')
  @RequirePermission('delivery.edit')
  markDelivered(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: DeliverDto,
  ) {
    return this.service.markDelivered(id, dto);
  }

  // DELETE /delivery-notes/:id  (PENDING only)
  @Delete(':id')
  @RequirePermission('delivery.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}