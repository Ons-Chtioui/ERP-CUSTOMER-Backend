// src/commercial/delivery-notes/delivery-notes.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { DeliveryNote, DeliveryStatus } from './entities/delivery-note.entity';
import { DeliveryNoteLine } from './entities/delivery-note-line.entity';
import { CreateDeliveryNoteDto } from './dto/create-delivery-note.dto';
import { DeliverDto } from './dto/deliver.dto';
import { Order } from '../../orders/entities/order.entity';

@Injectable()
export class DeliveryNotesService {
  constructor(
    @InjectRepository(DeliveryNote)     private repo:     Repository<DeliveryNote>,
    @InjectRepository(DeliveryNoteLine) private lineRepo: Repository<DeliveryNoteLine>,
  ) {}

  // ── Génération référence ──────────────────────────────────────
  private async generateReference(): Promise<string> {
    const year    = new Date().getFullYear();
    const pattern = `BL-${year}-%`;
    const count   = await this.repo.count({ where: { reference: Like(pattern) } });
    return `BL-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // ── CREATE ────────────────────────────────────────────────────
  async create(dto: CreateDeliveryNoteDto, userId: number): Promise<DeliveryNote> {
    const dn = await this.repo.save(
      this.repo.create({
        reference:       await this.generateReference(),
        clientId:        dto.clientId,
        orderId:         dto.orderId   ?? null,
        invoiceId:       dto.invoiceId ?? null,
        deliveryAddress: dto.deliveryAddress ?? null,
        note:            dto.note ?? null,
        status:          DeliveryStatus.PENDING,
        createdBy:       userId,
      }),
    );

    const lines = dto.lines.map((l, idx) =>
      this.lineRepo.create({
        deliveryNoteId:    dn.id,
        productId:         l.productId,
        quantityOrdered:   l.quantityOrdered,
        quantityDelivered: l.quantityDelivered,
        position:          l.position ?? idx,
      }),
    );
    await this.lineRepo.save(lines);

    return this.findOne(dn.id);
  }

  async createFromOrder(order: Order, userId: number): Promise<DeliveryNote | null> {
    const existing = await this.repo.findOne({ where: { orderId: order.id } });
    if (existing) return existing;

    const dto = {
      clientId:        order.clientId,
      orderId:         order.id,
      deliveryAddress: order.client?.address ?? null,
      note:            `BL auto-généré pour ${order.reference}`,
      lines: order.lines.map(l => ({
        productId:         l.productId,
        quantityOrdered:   l.quantity,
        quantityDelivered: l.quantity,
      })),
    };
    return this.create(dto as CreateDeliveryNoteDto, userId);
  }

  // ── FIND ALL ──────────────────────────────────────────────────
  async findAll(params?: { clientId?: number; status?: DeliveryStatus }) {
    const qb = this.repo
      .createQueryBuilder('dn')
      .leftJoinAndSelect('dn.client',  'client')
      .leftJoinAndSelect('dn.creator', 'creator')
      .leftJoinAndSelect('dn.lines',   'lines')
      .leftJoinAndSelect('lines.product', 'product')
      .orderBy('dn.created_at', 'DESC');

    if (params?.clientId) {
      qb.andWhere('dn.client_id = :clientId', { clientId: params.clientId });
    }
    if (params?.status) {
      qb.andWhere('dn.status = :status', { status: params.status });
    }

    return qb.getMany();
  }

  // ── FIND ONE ──────────────────────────────────────────────────
  async findOne(id: number): Promise<DeliveryNote> {
    const dn = await this.repo.findOne({
      where: { id },
      relations: {
        client: true,
        creator: true,
        lines: {
          product: true,
        },
        order: true,
        invoice: true,
      },
    });
    if (!dn) throw new NotFoundException(`Bon de livraison #${id} introuvable`);
    return dn;
  }

  // ── MARK DELIVERED / SIGNED ───────────────────────────────────
  async markDelivered(id: number, dto: DeliverDto): Promise<DeliveryNote> {
    const dn = await this.findOne(id);

    if (dn.status === DeliveryStatus.SIGNED) {
      throw new BadRequestException('Bon de livraison déjà signé');
    }

    dn.deliveredAt = new Date();
    dn.note        = dto.note ?? dn.note;

    if (dto.signatureUrl) {
      dn.status       = DeliveryStatus.SIGNED;
      dn.signatureUrl = dto.signatureUrl;
    } else {
      dn.status = DeliveryStatus.DELIVERED;
    }

    await this.repo.save(dn);
    return this.findOne(id);
  }

  // ── REMOVE (PENDING only) ─────────────────────────────────────
  async remove(id: number): Promise<void> {
    const dn = await this.findOne(id);
    if (dn.status !== DeliveryStatus.PENDING) {
      throw new BadRequestException(
        'Seuls les bons de livraison en attente peuvent être supprimés',
      );
    }
    await this.repo.remove(dn);
  }
}