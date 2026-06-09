// src/warehouses/warehouses.service.ts
import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse } from './entities/warehouse.entity';
import { InventoryItem } from '../components/entities/inventory-item.entity';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehousesRepo: Repository<Warehouse>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
  ) {}

  async findAll(): Promise<Warehouse[]> {
    return this.warehousesRepo.find({ order: { nom: 'ASC' } });
  }

  async findOne(id: number): Promise<Warehouse> {
    const w = await this.warehousesRepo.findOne({ where: { id } });
    if (!w) throw new NotFoundException(`Entrepôt #${id} introuvable`);
    return w;
  }

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    const existing = await this.warehousesRepo.findOne({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) throw new ConflictException(`Code "${dto.code}" déjà utilisé`);
    return this.warehousesRepo.save(
      this.warehousesRepo.create({ ...dto, code: dto.code.toUpperCase() })
    );
  }

  async update(id: number, dto: Partial<CreateWarehouseDto>): Promise<Warehouse> {
    const w = await this.findOne(id);
    if (dto.code && dto.code.toUpperCase() !== w.code) {
      const existing = await this.warehousesRepo.findOne({
        where: { code: dto.code.toUpperCase() },
      });
      if (existing) throw new ConflictException(`Code "${dto.code}" déjà utilisé`);
      dto.code = dto.code.toUpperCase();
    }
    Object.assign(w, dto);
    return this.warehousesRepo.save(w);
  }

  async toggleActive(id: number): Promise<Warehouse> {
    const w = await this.findOne(id);
    w.isActive = !w.isActive;
    return this.warehousesRepo.save(w);
  }

  async getStock(warehouseId: number) {
    await this.findOne(warehouseId);
    return this.inventoryRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.component', 'component')
      .leftJoinAndSelect('component.category', 'category')
      .leftJoinAndSelect('component.supplier', 'supplier')
      .where('item.warehouse_id = :warehouseId', { warehouseId })
      .orderBy('component.nom', 'ASC')
      .getMany();
  }

  async getGlobalSummary() {
    const warehouses = await this.warehousesRepo.find({ where: { isActive: true } });
    return Promise.all(
      warehouses.map(async (wh) => {
        const items = await this.inventoryRepo.find({
          where: { warehouse: { id: wh.id } },
          relations: { component: true },
        });
        return {
          warehouse: wh,
          totalItems: items.length,
          totalQuantity: items.reduce((s, i) => s + Number(i.quantity), 0),
          totalValue: Math.round(
            items.reduce((s, i) => s + Number(i.quantity) * Number(i.component?.prixAchat ?? 0), 0)
            * 100) / 100,
        };
      })
    );
  }
}