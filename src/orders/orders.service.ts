import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Order, OrderStatus }        from './entities/order.entity';
import { OrderLine }                 from './entities/order-line.entity';
import { OrderLineSupplement }       from './entities/order-line-supplement.entity';
import { OrderStatusHistory }        from './entities/order-status-history.entity';
import { Product }                   from '../products/entities/product.entity';
import { BomLine }                   from '../products/entities/bom-line.entity';
import { ProductInventory }          from '../products/entities/product-inventory.entity';
import { InventoryItem }             from '../components/entities/inventory-item.entity';
import { Warehouse }                 from '../warehouses/entities/warehouse.entity';
import { ProductsService }           from '../products/products.service';
import { CreateOrderDto }            from './dto/create-order.dto';
import { UpdateOrderStatusDto }      from './dto/update-order-status.dto';
import { QueryOrdersDto }            from './dto/query-orders.dto';

// Taux TVA par défaut (Tunisie)
const DEFAULT_TVA = 19;

// Transitions de statut autorisées
const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.DRAFT]:     [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.SHIPPED,   OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]:   [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

interface LineFulfillment {
  fromStock: number;
  fromAssembly: number;
  stockFini: number;
  stockFabricable: number;
  stockTotal: number;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderLine)
    private readonly lineRepo: Repository<OrderLine>,

    @InjectRepository(OrderLineSupplement)
    private readonly supplementRepo: Repository<OrderLineSupplement>,

    @InjectRepository(OrderStatusHistory)
    private readonly historyRepo: Repository<OrderStatusHistory>,

    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,

    @InjectRepository(ProductInventory)
    private readonly productInventoryRepo: Repository<ProductInventory>,

    @InjectRepository(BomLine)
    private readonly bomRepo: Repository<BomLine>,

    @InjectRepository(InventoryItem)
    private readonly inventoryItemRepo: Repository<InventoryItem>,

    @InjectRepository(Warehouse)
    private readonly warehouseRepo: Repository<Warehouse>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly productsService: ProductsService,
  ) {}

  // ── Génération référence ───────────────────────────────────────
  private async generateReference(): Promise<string> {
    const year  = new Date().getFullYear();
    const count = await this.orderRepo.count();
    return `CMD-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // ── Prix produit ───────────────────────────────────────────────
  private async getProductPricing(productId: number) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Produit ${productId} introuvable`);

    const unitPrice = Number(product.prixVente) > 0
      ? Number(product.prixVente)
      : Number(product.prixVenteAuto);

    return { product, unitPrice, tvaRate: DEFAULT_TVA };
  }

  // ── Stock disponible pour commande ────────────────────────────
  private async getLineFulfillment(productId: number, quantity: number): Promise<LineFulfillment> {
    const stock = await this.productsService.getOrderStockSummary(productId);
    const fromStock    = Math.min(quantity, stock.stockFini);
    const fromAssembly = Math.min(quantity - fromStock, stock.stockFabricable);
    return {
      fromStock,
      fromAssembly,
      stockFini: stock.stockFini,
      stockFabricable: stock.stockFabricable,
      stockTotal: stock.stockTotal,
    };
  }

  // ── Stock produit fini total ───────────────────────────────────
  private async getFinishedStockTotal(productId: number, manager?: EntityManager): Promise<number> {
    const repo = manager ? manager.getRepository(ProductInventory) : this.productInventoryRepo;
    const raw = await repo
      .createQueryBuilder('pi')
      .select('COALESCE(SUM(pi.quantity), 0)', 'total')
      .where('pi.product_id = :productId', { productId })
      .getRawOne() as { total: string } | null;
    return Number(raw?.total ?? 0);
  }

  // ── Déduire stock produit fini ─────────────────────────────────
  private async deductFinishedStock(
    manager: EntityManager,
    productId: number,
    quantity: number,
  ): Promise<void> {
    const items = await manager
      .createQueryBuilder(ProductInventory, 'pi')
      .where('pi.product_id = :productId', { productId })
      .orderBy('pi.quantity', 'DESC')
      .setLock('pessimistic_write')
      .getMany();

    let remaining = quantity;
    for (const item of items) {
      if (remaining <= 0) break;
      const take = Math.min(Number(item.quantity), remaining);
      item.quantity = Number(item.quantity) - take;
      remaining -= take;
      await manager.save(ProductInventory, item);
    }
    if (remaining > 0) {
      throw new BadRequestException(`Stock produit fini insuffisant (productId=${productId})`);
    }
  }

  // ── Restituer stock produit fini ───────────────────────────────
  private async restoreFinishedStock(
    manager: EntityManager,
    productId: number,
    quantity: number,
  ): Promise<void> {
    if (quantity <= 0) return;

    let item = await manager.findOne(ProductInventory, {
      where: { product: { id: productId } },
      order: { quantity: 'DESC' },
      lock: { mode: 'pessimistic_write' },
    });

    if (item) {
      item.quantity = Number(item.quantity) + quantity;
      await manager.save(ProductInventory, item);
      return;
    }

    const warehouses = await manager.find(Warehouse, { take: 1 });
    if (warehouses.length === 0) return;

    await manager.save(ProductInventory, manager.create(ProductInventory, {
      product:   { id: productId },
      warehouse: { id: warehouses[0].id },
      quantity,
    }));
  }

  // ── Déduire composants BOM ────────────────────────────────────
  private async deductComponents(
    manager: EntityManager,
    productId: number,
    quantity: number,
    productName?: string,
  ): Promise<void> {
    const bomLines = await manager.find(BomLine, {
      where: { product: { id: productId } },
      relations: { component: true },
    });
    if (bomLines.length === 0) {
      throw new BadRequestException(
        `Impossible d'assembler ${productName ?? 'le produit'} : nomenclature (BOM) absente`,
      );
    }

    for (const bom of bomLines) {
      const needed = Number(bom.quantity) * quantity;
      const items  = await manager
        .createQueryBuilder(InventoryItem, 'i')
        .where('i.component_id = :cId', { cId: bom.component.id })
        .orderBy('i.quantity', 'DESC')
        .setLock('pessimistic_write')
        .getMany();

      let remaining = needed;
      for (const item of items) {
        if (remaining <= 0) break;
        const take = Math.min(Number(item.quantity), remaining);
        item.quantity = Number(item.quantity) - take;
        remaining -= take;
        await manager.save(InventoryItem, item);
      }
      if (remaining > 0) {
        throw new BadRequestException(`Stock composant insuffisant: ${bom.component.nom}`);
      }
    }
  }

  // ── Restituer composants BOM ──────────────────────────────────
  private async restoreComponents(
    manager: EntityManager,
    productId: number,
    quantity: number,
  ): Promise<void> {
    if (quantity <= 0) return;

    const bomLines = await manager.find(BomLine, {
      where: { product: { id: productId } },
      relations: { component: true },
    });

    for (const bom of bomLines) {
      const toRestore = Number(bom.quantity) * quantity;
      const items = await manager
        .createQueryBuilder(InventoryItem, 'i')
        .where('i.component_id = :cId', { cId: bom.component.id })
        .orderBy('i.quantity', 'ASC')
        .getMany();

      let rem = toRestore;
      for (const item of items) {
        if (rem <= 0) break;
        const add = Math.min(100, rem);
        item.quantity = Number(item.quantity) + add;
        rem -= add;
        await manager.save(InventoryItem, item);
      }

      if (rem > 0) {
        const warehouses = await manager.find(Warehouse, { take: 1 });
        if (warehouses.length > 0) {
          await manager.save(InventoryItem, manager.create(InventoryItem, {
            component:   { id: bom.component.id },
            warehouse:   { id: warehouses[0].id },
            quantity:    rem,
            reservedQty: 0,
          }));
        }
      }
    }
  }

  // ── Créer commande ─────────────────────────────────────────────
  async create(dto: CreateOrderDto, userId: number): Promise<Order> {
    const order = await this.orderRepo.save(
      this.orderRepo.create({
        reference: await this.generateReference(),
        clientId:  dto.clientId,
        note:      dto.note ?? null,
        discount:  dto.discount ?? 0,
        createdBy: userId,
        status:    OrderStatus.DRAFT,
      }),
    );

    const { totalHt, totalTva } = await this.saveLines(
      order.id, dto.lines ?? [], dto.discount ?? 0,
    );

    await this.orderRepo.update(order.id, {
      totalHt:  round(totalHt),
      totalTva: round(totalTva),
      totalTtc: round(totalHt + totalTva),
    });

    await this.recordHistory(order.id, null, OrderStatus.DRAFT, userId);
    return this.findOne(order.id);
  }

  // ── Sauvegarder lignes + suppléments ──────────────────────────
  // BUG CORRIGÉ 1 : savedLine manquait (lineRepo.save non capturé)
  // BUG CORRIGÉ 2 : boucle supplements était en dehors du for principal
  private async saveLines(
    orderId: number,
    lines: CreateOrderDto['lines'],
    globalDiscount: number,
  ) {
    let totalHt  = 0;
    let totalTva = 0;

    for (const item of lines) {
      const { unitPrice, tvaRate } = await this.getProductPricing(item.productId);
      const ld      = item.discount ?? 0;
      const lineHt  = item.quantity * unitPrice * (1 - ld / 100);
      const lineTva = lineHt * (tvaRate / 100);
      totalHt  += lineHt;
      totalTva += lineTva;

      // ── BUG CORRIGÉ : capturer savedLine ──────────────────────
      const savedLine = await this.lineRepo.save(
        this.lineRepo.create({
          orderId,
          productId:       item.productId,
          quantity:        item.quantity,
          unitPrice,
          tvaRate,
          discount:        ld,
          totalHt:         round(lineHt),
          qtyFromStock:    0,
          qtyFromAssembly: 0,
        }),
      );

      // ── Suppléments de cette ligne ─────────────────────────────
      for (const s of item.supplements ?? []) {
        const rate   = s.tvaRate ?? DEFAULT_TVA;
        const suppHt = round(s.quantity * s.unitPrice);
        totalHt  += suppHt;
        totalTva += suppHt * (rate / 100);

        await this.supplementRepo.save(
          this.supplementRepo.create({
            orderLineId: savedLine.id,
            componentId: s.componentId,
            quantity:    s.quantity,
            unitPrice:   s.unitPrice,
            tvaRate:     rate,
            totalHt:     suppHt,
            qtyDeducted: 0,
            note:        s.note ?? null,
          }),
        );
      }
    }

    totalHt  *= (1 - globalDiscount / 100);
    totalTva *= (1 - globalDiscount / 100);
    return { totalHt, totalTva };
  }

  // ── Vérifier stock avant confirmation ─────────────────────────
  // BUG CORRIGÉ 3 : vérification suppléments manquait
  private async checkStock(order: Order): Promise<void> {
    const missing: object[] = [];

    for (const line of order.lines) {
      const fulfillment = await this.getLineFulfillment(line.productId, line.quantity);
      if (fulfillment.fromStock + fulfillment.fromAssembly < line.quantity) {
        missing.push({
          type:            'product',
          name:            line.product?.nom ?? 'Produit',
          available:       fulfillment.stockTotal,
          stockFini:       fulfillment.stockFini,
          stockFabricable: fulfillment.stockFabricable,
          needed:          line.quantity,
        });
      }

      // Vérifier stock des suppléments
      for (const supp of line.supplements ?? []) {
        const raw = await this.inventoryItemRepo
          .createQueryBuilder('i')
          .select('COALESCE(SUM(i.quantity), 0)', 'total')
          .where('i.component_id = :cId', { cId: supp.componentId })
          .getRawOne() as { total: string };
        const available = Number(raw?.total ?? 0);
        if (available < supp.quantity) {
          missing.push({
            type:      'supplement',
            name:      supp.component?.nom ?? `Composant #${supp.componentId}`,
            available,
            needed:    supp.quantity,
          });
        }
      }
    }

    if (missing.length > 0) {
      throw new BadRequestException({ message: 'Stock insuffisant', missing });
    }
  }

  // ── Décrémenter stock à la confirmation ───────────────────────
  // BUG CORRIGÉ 4 : déduction suppléments manquait
  private async deductStock(order: Order, _userId: number): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const line of order.lines) {
        const stockFini = await this.getFinishedStockTotal(line.productId, manager);
        const { stockDisponible: stockFabricable } =
          await this.productsService.getAvailability(line.productId);

        const fromStock    = Math.min(line.quantity, stockFini);
        const fromAssembly = line.quantity - fromStock;

        if (fromAssembly > stockFabricable) {
          throw new BadRequestException(`Stock insuffisant pour ${line.product?.nom}`);
        }
        if (fromAssembly > 0) {
          const bomCount = await manager.count(BomLine, {
            where: { product: { id: line.productId } },
          });
          if (bomCount === 0) {
            throw new BadRequestException(
              `Impossible d'assembler ${line.product?.nom} : nomenclature (BOM) absente`,
            );
          }
        }

        if (fromStock > 0)
          await this.deductFinishedStock(manager, line.productId, fromStock);
        if (fromAssembly > 0)
          await this.deductComponents(manager, line.productId, fromAssembly, line.product?.nom);

        await manager.update(OrderLine, line.id, {
          qtyFromStock:    fromStock,
          qtyFromAssembly: fromAssembly,
        });

        // ── Déduire les suppléments du stock composants ───────────
        for (const supp of line.supplements ?? []) {
          const items = await manager
            .createQueryBuilder(InventoryItem, 'i')
            .where('i.component_id = :cId', { cId: supp.componentId })
            .orderBy('i.quantity', 'DESC')
            .setLock('pessimistic_write')
            .getMany();

          let remaining = Number(supp.quantity);
          for (const item of items) {
            if (remaining <= 0) break;
            const take = Math.min(Number(item.quantity), remaining);
            item.quantity = Number(item.quantity) - take;
            remaining -= take;
            await manager.save(InventoryItem, item);
          }
          if (remaining > 0) {
            throw new BadRequestException(
              `Stock insuffisant pour le supplément: ${supp.component?.nom ?? supp.componentId}`,
            );
          }
          await manager.update(OrderLineSupplement, supp.id, { qtyDeducted: supp.quantity });
        }
      }
    });
  }

  // ── Restituer stock si annulation ─────────────────────────────
  // BUG CORRIGÉ 5 : restitution suppléments manquait
  private async restoreStock(order: Order): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      for (const line of order.lines) {
        let fromStock    = Number(line.qtyFromStock ?? 0);
        let fromAssembly = Number(line.qtyFromAssembly ?? 0);

        if (fromStock === 0 && fromAssembly === 0) {
          fromStock = line.quantity;
        }

        if (fromStock > 0)
          await this.restoreFinishedStock(manager, line.productId, fromStock);
        if (fromAssembly > 0)
          await this.restoreComponents(manager, line.productId, fromAssembly);

        await manager.update(OrderLine, line.id, {
          qtyFromStock:    0,
          qtyFromAssembly: 0,
        });

        // ── Restituer les suppléments au stock composants ─────────
        for (const supp of line.supplements ?? []) {
          const qty = Number(supp.qtyDeducted ?? 0);
          if (qty <= 0) continue;

          const items = await manager
            .createQueryBuilder(InventoryItem, 'i')
            .where('i.component_id = :cId', { cId: supp.componentId })
            .orderBy('i.quantity', 'ASC')
            .getMany();

          let rem = qty;
          for (const item of items) {
            if (rem <= 0) break;
            item.quantity = Number(item.quantity) + rem;
            rem = 0;
            await manager.save(InventoryItem, item);
          }
          if (rem > 0) {
            const warehouses = await manager.find(Warehouse, { take: 1 });
            if (warehouses.length > 0) {
              await manager.save(InventoryItem, manager.create(InventoryItem, {
                component:   { id: supp.componentId },
                warehouse:   { id: warehouses[0].id },
                quantity:    rem,
                reservedQty: 0,
              }));
            }
          }
          await manager.update(OrderLineSupplement, supp.id, { qtyDeducted: 0 });
        }
      }
    });
  }

  // ── Changer statut ─────────────────────────────────────────────
  async updateStatus(id: number, dto: UpdateOrderStatusDto, userId: number): Promise<Order> {
    const order = await this.findOne(id);

    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transition ${order.status} → ${dto.status} non autorisée`,
      );
    }

    const fromStatus = order.status;

    if (dto.status === OrderStatus.CONFIRMED) {
      await this.checkStock(order);
      await this.deductStock(order, userId);
    }

    if (dto.status === OrderStatus.CANCELLED && order.status !== OrderStatus.DRAFT) {
      await this.restoreStock(order);
    }

    const patch: Partial<Order> = { status: dto.status };
    if (dto.status === OrderStatus.CONFIRMED) patch.confirmedAt = new Date();
    if (dto.status === OrderStatus.SHIPPED)   patch.shippedAt   = new Date();
    if (dto.status === OrderStatus.DELIVERED) patch.deliveredAt = new Date();
    if (dto.status === OrderStatus.CANCELLED) {
      patch.cancelledAt = new Date();
      patch.cancelledBy = userId;
    }

    await this.orderRepo.update(id, patch);
    await this.recordHistory(id, fromStatus, dto.status, userId, dto.comment);
    return this.findOne(id);
  }

  // ── Modifier lignes (DRAFT seulement) ─────────────────────────
  async updateLines(
    id: number,
    dto: Partial<CreateOrderDto>,
    userId: number,
  ): Promise<Order> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Seules les commandes en brouillon peuvent être modifiées');
    }

    // cascade: true sur OrderLine supprime automatiquement les supplements
    await this.lineRepo.delete({ orderId: id });

    const lines          = dto.lines ?? [];
    const globalDiscount = dto.discount ?? Number(order.discount);
    const { totalHt, totalTva } = await this.saveLines(id, lines, globalDiscount);

    await this.orderRepo.update(id, {
      discount: globalDiscount,
      note:     dto.note ?? order.note,
      clientId: dto.clientId ?? order.clientId,
      totalHt:  round(totalHt),
      totalTva: round(totalTva),
      totalTtc: round(totalHt + totalTva),
    });

    return this.findOne(id);
  }

  // ── Find All ───────────────────────────────────────────────────
  async findAll(query: QueryOrdersDto) {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.client', 'client')
      .leftJoinAndSelect('o.lines', 'lines')
      .leftJoinAndSelect('lines.product', 'product')
      .leftJoinAndSelect('lines.supplements', 'supplements')
      .leftJoinAndSelect('supplements.component', 'suppComponent')
      .leftJoinAndSelect('o.creator', 'creator')
      .orderBy('o.created_at', 'DESC');

    if (query.status)   qb.andWhere('o.status = :status',        { status: query.status });
    if (query.clientId) qb.andWhere('o.client_id = :clientId',   { clientId: query.clientId });
    if (query.dateFrom) qb.andWhere('o.created_at >= :dateFrom', { dateFrom: query.dateFrom });
    if (query.dateTo)   qb.andWhere('o.created_at <= :dateTo',   { dateTo: query.dateTo });

    const total = await qb.getCount();
    const page  = query.page  ?? 1;
    const limit = query.limit ?? 20;

    qb.skip((page - 1) * limit).take(limit);
    const data = await qb.getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Find One ───────────────────────────────────────────────────
  async findOne(id: number): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: {
        client: true,
        lines: { product: true, supplements: { component: true } },
        statusHistory: { user: true },
        creator: true,
      },
    });
    if (!order) throw new NotFoundException(`Commande #${id} introuvable`);
    return order;
  }

  // ── Stats ──────────────────────────────────────────────────────
  async getStats() {
    const stats = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(o.total_ttc)', 'total')
      .groupBy('o.status')
      .getRawMany() as { status: string; count: string; total: string }[];

    const totalOrders  = stats.reduce((s, r) => s + Number(r.count), 0);
    const totalRevenue = stats.reduce((s, r) => s + Number(r.total ?? 0), 0);

    return {
      stats,
      totalOrders,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };
  }

  // ── Vérifier disponibilité (lecture seule) ────────────────────
  async checkAvailability(id: number) {
    const order = await this.findOne(id);
    const lines: object[]   = [];
    const missing: object[] = [];

    for (const line of order.lines) {
      const fulfillment = await this.getLineFulfillment(line.productId, line.quantity);
      const canFulfill  = fulfillment.fromStock + fulfillment.fromAssembly >= line.quantity;

      const lineInfo = {
        productId:       line.productId,
        name:            line.product?.nom,
        quantity:        line.quantity,
        stockFini:       fulfillment.stockFini,
        stockFabricable: fulfillment.stockFabricable,
        stockTotal:      fulfillment.stockTotal,
        fromStock:       fulfillment.fromStock,
        fromAssembly:    fulfillment.fromAssembly,
        canFulfill,
      };
      lines.push(lineInfo);

      if (!canFulfill) {
        missing.push({ ...lineInfo, available: fulfillment.stockTotal, needed: line.quantity });
      }
    }

    return {
      orderId:    id,
      reference:  order.reference,
      canConfirm: missing.length === 0,
      lines,
      missing,
    };
  }

  /** Prévisualisation pour l'ajout d'une ligne de commande */
  async previewLineFulfillment(productId: number, quantity: number) {
    return this.productsService.getFulfillmentPreview(productId, quantity);
  }

  // ── Supprimer (DRAFT seulement) ───────────────────────────────
  async remove(id: number): Promise<void> {
    const order = await this.findOne(id);
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException('Seules les commandes en brouillon peuvent être supprimées');
    }
    await this.orderRepo.remove(order);
  }

  // ── Helper : historique ───────────────────────────────────────
  private async recordHistory(
    orderId: number,
    fromStatus: OrderStatus | null,
    toStatus: OrderStatus,
    changedBy: number,
    comment?: string,
  ) {
    await this.historyRepo.save(
      this.historyRepo.create({
        orderId,
        fromStatus,
        toStatus,
        changedBy,
        comment: comment ?? null,
      }),
    );
  }
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}