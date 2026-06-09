import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { StockAlertsService } from '../stock-alerts/stock-alerts.service';
import { CreateMovementDto, CreateTransferDto } from './dto/create-movement.dto';

@Injectable()
export class StockMovementsService {
    constructor(
        @InjectRepository(StockMovement)
        private readonly movementsRepo: Repository<StockMovement>,
        @InjectRepository(InventoryItem)
        private readonly inventoryRepo: Repository<InventoryItem>,
        @InjectDataSource()
        private readonly dataSource: DataSource,
        private readonly alertsService: StockAlertsService,
    ){}
    //  ENTRÉE
    async createIn(dto: CreateMovementDto,userId:number): Promise<StockMovement> {
        return this.dataSource.transaction(async(manager) => {
         if(dto.quantity <= 0) throw new BadRequestException('La quantité doit être positive');
         const item = await this.getOrCreate(manager, dto.warehouseId, dto.componentId);
         const before=Number(item.quantity);
         const after=before+dto.quantity;
         await manager .update(InventoryItem, { id: item.id }, { quantity: after });

         const movement = manager.save(StockMovement, manager.create(StockMovement, {
            warehouse: { id: dto.warehouseId },
            component: { id: dto.componentId },
            user:{ id: userId },
            type: MovementType.IN,
            quantity: dto.quantity,
            quantityBefore: before,
            quantityAfter: after,
            referenceDoc: dto.referenceDoc,
            notes: dto.notes,
         }));
         await this.alertsService.checkAndCreate(manager, dto.warehouseId, dto.componentId, after);
         return movement;
            
        })
    }
    async createOut(dto: CreateMovementDto, userId: number): Promise<StockMovement> {
    return this.dataSource.transaction(async (manager) => {
      if (dto.quantity <= 0)
        throw new BadRequestException('La quantité doit être positive');

      const item = await this.getOrFail(manager, dto.warehouseId, dto.componentId);
      const before = Number(item.quantity);

      // RÈGLE 1 — stock non négatif
      if (dto.quantity > before)
        throw new BadRequestException(
          `Stock insuffisant. Disponible: ${before}, demandé: ${dto.quantity}`
        );

      const after = before - dto.quantity;
      await manager.update(InventoryItem, item.id, { quantity: after });

      const movement = await manager.save(StockMovement, manager.create(StockMovement, {
        warehouse:  { id: dto.warehouseId },
        component:  { id: dto.componentId },
        user:       { id: userId },
        type:       MovementType.OUT,
        quantity:   dto.quantity,
        quantityBefore: before,
        quantityAfter:  after,
        referenceDoc: dto.referenceDoc,
        notes: dto.notes,
      }));

      await this.alertsService.checkAndCreate(manager, dto.warehouseId, dto.componentId, after);
      return movement;
    });
  }

  // ── TRANSFERT ───────────────────────────────────────────────────
  async createTransfer(dto: CreateTransferDto, userId: number) {
    if (dto.warehouseId === dto.targetWarehouseId)
      throw new BadRequestException('Source et destination identiques');

    return this.dataSource.transaction(async (manager) => {
      if (dto.quantity <= 0)
        throw new BadRequestException('La quantité doit être positive');

      const srcItem = await this.getOrFail(manager, dto.warehouseId, dto.componentId);
      const srcBefore = Number(srcItem.quantity);

      if (dto.quantity > srcBefore)
        throw new BadRequestException(`Stock insuffisant dans la source. Disponible: ${srcBefore}`);

      const dstItem = await this.getOrCreate(manager, dto.targetWarehouseId, dto.componentId);
      const dstBefore = Number(dstItem.quantity);

      const srcAfter = srcBefore - dto.quantity;
      const dstAfter = dstBefore + dto.quantity;

      await manager.update(InventoryItem, srcItem.id, { quantity: srcAfter });
      await manager.update(InventoryItem, dstItem.id, { quantity: dstAfter });

      const [outMov, inMov] = await manager.save(StockMovement, [
        manager.create(StockMovement, {
          warehouse: { id: dto.warehouseId },
          component: { id: dto.componentId },
          user: { id: userId },
          type: MovementType.TRANSFER,
          quantity: dto.quantity,
          quantityBefore: srcBefore, quantityAfter: srcAfter,
          targetWarehouse: { id: dto.targetWarehouseId },
          referenceDoc: dto.referenceDoc, notes: dto.notes,
        }),
        manager.create(StockMovement, {
          warehouse: { id: dto.targetWarehouseId },
          component: { id: dto.componentId },
          user: { id: userId },
          type: MovementType.TRANSFER,
          quantity: dto.quantity,
          quantityBefore: dstBefore, quantityAfter: dstAfter,
          targetWarehouse: { id: dto.warehouseId },
          referenceDoc: dto.referenceDoc, notes: dto.notes,
        }),
      ]);

      await this.alertsService.checkAndCreate(manager, dto.warehouseId, dto.componentId, srcAfter);
      await this.alertsService.checkAndCreate(manager, dto.targetWarehouseId, dto.componentId, dstAfter);

      return { outMov, inMov };
    });
  }

  // ── HISTORIQUE ──────────────────────────────────────────────────
  async findHistory(filters: {
    warehouseId?: number;
    componentId?: number;
    type?: MovementType;
    limit?: number;
  }) {
    const qb = this.movementsRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.warehouse', 'warehouse')
      .leftJoinAndSelect('m.component', 'component')
      .leftJoinAndSelect('m.user', 'user')
      .leftJoinAndSelect('m.targetWarehouse', 'target')
      .orderBy('m.created_at', 'DESC');

    if (filters.warehouseId)
      qb.andWhere('m.warehouse_id = :wId', { wId: filters.warehouseId });
    if (filters.componentId)
      qb.andWhere('m.component_id = :cId', { cId: filters.componentId });
    if (filters.type)
      qb.andWhere('m.type = :type', { type: filters.type });

    qb.take(filters.limit ?? 100);
    return qb.getMany();
  }

  // ── HELPERS ─────────────────────────────────────────────────────
  private async getOrCreate(
    manager: EntityManager, warehouseId: number, componentId: number
  ): Promise<InventoryItem> {
    let item = await manager.findOne(InventoryItem, {
      where: { warehouse: { id: warehouseId }, component: { id: componentId } },
    });
    if (!item) {
      item = await manager.save(InventoryItem, manager.create(InventoryItem, {
        warehouse: { id: warehouseId },
        component: { id: componentId },
        quantity: 0, reservedQty: 0,
      }));
    }
    return item;
  }

  private async getOrFail(
    manager: EntityManager, warehouseId: number, componentId: number
  ): Promise<InventoryItem> {
    const item = await manager.findOne(InventoryItem, {
      where: { warehouse: { id: warehouseId }, component: { id: componentId } },
    });
    if (!item)
      throw new BadRequestException('Composant introuvable dans cet entrepôt');
    return item;
  }
}
