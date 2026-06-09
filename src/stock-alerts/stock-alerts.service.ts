// src/stock-alerts/stock-alerts.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { StockAlert, AlertStatus } from './entities/stock-alert.entity';
import { Component } from '../components/entities/component.entity';

@Injectable()
export class StockAlertsService {
  constructor(
    @InjectRepository(StockAlert)
    private readonly alertsRepo: Repository<StockAlert>,
    @InjectRepository(Component)
    private readonly componentsRepo: Repository<Component>,
  ) {}

  async checkAndCreate(
    manager: EntityManager, warehouseId: number, componentId: number, currentQty: number
  ): Promise<void> {
    const comp = await this.componentsRepo.findOne({ where: { id: componentId } });
    if (!comp || comp.seuilAlerte <= 0) return;

    if (currentQty <= comp.seuilAlerte) {
      const existing = await manager.findOne(StockAlert, {
        where: { warehouse: { id: warehouseId }, component: { id: componentId }, status: AlertStatus.ACTIVE },
      });
      if (!existing) {
        await manager.save(StockAlert, manager.create(StockAlert, {
          warehouse: { id: warehouseId },
          component: { id: componentId },
          quantityAtAlert: currentQty,
          threshold: comp.seuilAlerte,
          status: AlertStatus.ACTIVE,
        }));
      }
    }
  }

  async checkAndResolve(
    manager: EntityManager, warehouseId: number, componentId: number, currentQty: number
  ): Promise<void> {
    const comp = await this.componentsRepo.findOne({ where: { id: componentId } });
    if (!comp) return;

    if (currentQty > comp.seuilAlerte) {
      await manager
        .createQueryBuilder()
        .update(StockAlert)
        .set({ status: AlertStatus.RESOLVED, resolvedAt: new Date() })
        .where('warehouse_id = :wId', { wId: warehouseId })
        .andWhere('component_id = :cId', { cId: componentId })
        .andWhere('status = :status', { status: AlertStatus.ACTIVE })
        .execute();
    }
  }

  async findActive(warehouseId?: number) {
    const qb = this.alertsRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.warehouse', 'warehouse')
      .leftJoinAndSelect('a.component', 'component')
      .leftJoinAndSelect('component.category', 'category')
      .where('a.status = :status', { status: AlertStatus.ACTIVE })
      .orderBy('a.created_at', 'DESC');

    if (warehouseId) qb.andWhere('a.warehouse_id = :wId', { wId: warehouseId });
    return qb.getMany();
  }
}