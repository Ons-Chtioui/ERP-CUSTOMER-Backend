import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { InventorySession, SessionStatus } from './entities/inventory-session.entity';
import { InventoryLine } from './entities/inventory-line.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { Component } from '../components/entities/component.entity';
import { StockMovement, MovementType } from '../stock-movements/entities/stock-movement.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventorySession)
    private readonly sessionsRepo: Repository<InventorySession>,
    @InjectRepository(InventoryLine)
    private readonly linesRepo: Repository<InventoryLine>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(Component)
    private readonly componentsRepo: Repository<Component>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createSession(dto: { warehouseId: number; nom?: string }, userId: number) {
    const active = await this.sessionsRepo.findOne({
      where: { warehouse: { id: dto.warehouseId }, status: SessionStatus.IN_PROGRESS },
    });
    if (active)
      throw new BadRequestException(`Session #${active.id} déjà en cours sur cet entrepôt`);

    return this.sessionsRepo.save(
      this.sessionsRepo.create({
        warehouse: { id: dto.warehouseId },
        user: { id: userId },
        nom: dto.nom,
        status: SessionStatus.DRAFT,
      })
    );
  }

  async startSession(sessionId: number) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
      relations: { warehouse: true },
    });
    if (!session) throw new NotFoundException(`Session #${sessionId} introuvable`);
    if (session.status !== SessionStatus.DRAFT)
      throw new BadRequestException('La session n\'est pas en état draft');

    return this.dataSource.transaction(async (manager) => {
      const items = await this.inventoryRepo.find({
        where: { warehouse: { id: session.warehouse.id } },
        relations: { component: true },
      });

      await manager.save(InventoryLine, items.map((i) =>
        manager.create(InventoryLine, {
          session: { id: sessionId },
          component: i.component,
          quantityTheoretical: i.quantity,
          quantityCounted: null,
          ecart: null,
        })
      ));

      await manager.update(InventorySession, sessionId, {
        status: SessionStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      return manager.findOne(InventorySession, {
        where: { id: sessionId },
        relations: { lines: true, warehouse: true },
      });
    });
  }

  async countLine(sessionId: number, componentId: number, quantityCounted: number, notes?: string) {
    const session = await this.sessionsRepo.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session introuvable');
    if (session.status !== SessionStatus.IN_PROGRESS)
      throw new BadRequestException('Session non active');
    if (quantityCounted < 0)
      throw new BadRequestException('Quantité négative non autorisée');

    const line = await this.linesRepo.findOne({
      where: { session: { id: sessionId }, component: { id: componentId } },
      relations: { component: true },
    });
    if (!line) throw new NotFoundException('Ligne introuvable dans cette session');

    const ecart = quantityCounted - Number(line.quantityTheoretical);
    await this.linesRepo.update(line.id, {
      quantityCounted, ecart, notes, countedAt: new Date(),
    });

    return this.linesRepo.findOne({ 
      where: { id: line.id }, 
      relations: { component: true } 
    });
  }

  async closeSession(sessionId: number, userId: number) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
      relations: { warehouse: true, lines: true },
    });
    if (!session) throw new NotFoundException('Session introuvable');
    if (session.status !== SessionStatus.IN_PROGRESS)
      throw new BadRequestException('Session non active');

    const uncounted = session.lines.filter((l) => l.quantityCounted === null);
    if (uncounted.length > 0)
      throw new BadRequestException(`${uncounted.length} ligne(s) non comptée(s)`);

    return this.dataSource.transaction(async (manager) => {
      for (const line of session.lines) {
        const ecart = Number(line.ecart);
        if (ecart === 0) continue;

        const item = await manager.findOne(InventoryItem, {
          where: { 
            warehouse: { id: session.warehouse.id }, 
            component: { id: line.component.id } 
          },
        });
        if (!item) continue;

        const before = Number(item.quantity);
        const after  = Number(line.quantityCounted);

        await manager.update(InventoryItem, item.id, { quantity: after });
        await manager.save(StockMovement, manager.create(StockMovement, {
          warehouse: { id: session.warehouse.id },
          component: { id: line.component.id },
          user: { id: userId },
          type: MovementType.ADJUSTMENT,
          quantity: Math.abs(ecart),
          quantityBefore: before,
          quantityAfter: after,
          inventorySessionId: sessionId,
          notes: `Inventaire #${sessionId} — écart: ${ecart > 0 ? '+' : ''}${ecart}`,
        }));
      }

      await manager.update(InventorySession, sessionId, {
        status: SessionStatus.CLOSED,
        closedAt: new Date(),
      });

      return manager.findOne(InventorySession, {
        where: { id: sessionId },
        relations: { warehouse: true, lines: { component: true } },
      });
    });
  }

  async findAll(warehouseId?: number) {
    return this.sessionsRepo.find({
      where: warehouseId ? { warehouse: { id: warehouseId } } : {},
      relations: { warehouse: true, user: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number) {
    const session = await this.sessionsRepo.findOne({
      where: { id },
      relations: { 
        warehouse: true, 
        user: true, 
        lines: { component: true } 
      },
    });
    if (!session) throw new NotFoundException(`Session #${id} introuvable`);
    return session;
  }
}