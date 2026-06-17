import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';

import { Product }          from './entities/product.entity';
import { BomLine }          from './entities/bom-line.entity';
import { ProductionLog }    from './entities/production-log.entity';
import { ProductInventory } from './entities/product-inventory.entity';
import { Component }        from '../components/entities/component.entity';
import { InventoryItem }    from '../components/entities/inventory-item.entity';
import { Warehouse }        from '../warehouses/entities/warehouse.entity';
import { ProductCategory }  from '../product-categories/entities/product-category.entity';
import { StockMovement, MovementType } from '../stock-movements/entities/stock-movement.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { SetBomDto }        from './dto/set-bom.dto';
import { ProduceDto }       from './dto/produce.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(BomLine)
    private readonly bomRepo: Repository<BomLine>,
    @InjectRepository(ProductionLog)
    private readonly logsRepo: Repository<ProductionLog>,
    @InjectRepository(ProductInventory)
    private readonly productInventoryRepo: Repository<ProductInventory>,
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(Component)
    private readonly componentsRepo: Repository<Component>,
    @InjectRepository(Warehouse)
    private readonly warehousesRepo: Repository<Warehouse>,
    @InjectRepository(ProductCategory)
    private readonly categoriesRepo: Repository<ProductCategory>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // ──────────────────────────────────────────────────────────────
  // CRUD PRODUITS
  // ──────────────────────────────────────────────────────────────

  async findAll(filter?: { categoryId?: number; parentId?: number; search?: string }): Promise<Product[]> {
    const qb = this.productsRepo.createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.parent', 'parent')
      .leftJoinAndSelect('p.variants', 'variants')
      .where('p.is_active = true');

    if (filter?.categoryId) qb.andWhere('p.category_id = :catId', { catId: filter.categoryId });
    if (filter?.parentId)   qb.andWhere('p.parent_id = :pid',     { pid: filter.parentId });
    if (filter?.search)     qb.andWhere('(p.nom ILIKE :s OR p.reference ILIKE :s)', { s: `%${filter.search}%` });

    return qb.orderBy('p.nom', 'ASC').getMany();
  }

  async findOne(id: number): Promise<Product> {
    const p = await this.productsRepo.findOne({
      where: { id },
      relations: { category: true, parent: true, variants: true, bomLines: { component: true } },
    });
    if (!p) throw new NotFoundException(`Produit #${id} introuvable`);
    return p;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    // Vérifier unicité référence
    const existing = await this.productsRepo.findOne({ where: { reference: dto.reference } });
    if (existing) throw new ConflictException(`Référence "${dto.reference}" déjà utilisée`);

    const product = this.productsRepo.create({
      nom: dto.nom,
      reference: dto.reference,
      description: dto.description,
      unite: dto.unite ?? 'unité',
      prixVente: dto.prixVente ?? 0,
      coutMO: dto.coutMO ?? 0,
      seuilAlerte: dto.seuilAlerte ?? 0,
    });

    if (dto.categoryId) {
      const cat = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
      if (!cat) throw new NotFoundException(`Catégorie #${dto.categoryId} introuvable`);
      product.category = cat;
    }

    if (dto.parentId) {
      const parent = await this.productsRepo.findOne({ where: { id: dto.parentId }, relations: { parent: true } });
      if (!parent) throw new NotFoundException(`Produit parent #${dto.parentId} introuvable`);
      // Règle : variante max 2 niveaux (pas de variante de variante)
      if (parent.parent !== null)
        throw new BadRequestException('Les variantes ne peuvent avoir qu\'un seul niveau de hiérarchie');
      product.parent = parent;
    }

    return this.productsRepo.save(product);
  }

  async update(id: number, dto: Partial<CreateProductDto>): Promise<Product> {
    const p = await this.findOne(id);

    if (dto.reference && dto.reference !== p.reference) {
      const dup = await this.productsRepo.findOne({ where: { reference: dto.reference } });
      if (dup) throw new ConflictException(`Référence "${dto.reference}" déjà utilisée`);
    }

    if (dto.categoryId !== undefined) {
      if (dto.categoryId === null) {
        p.category = null;
      } else {
        const cat = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
        if (!cat) throw new NotFoundException(`Catégorie #${dto.categoryId} introuvable`);
        p.category = cat;
      }
    }

    Object.assign(p, {
      nom:         dto.nom         ?? p.nom,
      reference:   dto.reference   ?? p.reference,
      description: dto.description ?? p.description,
      unite:       dto.unite       ?? p.unite,
      prixVente:   dto.prixVente   ?? p.prixVente,
      seuilAlerte: dto.seuilAlerte ?? p.seuilAlerte,
    });

    // Si coutMO change → recalculer coût de revient
    if (dto.coutMO !== undefined && dto.coutMO !== Number(p.coutMO)) {
      p.coutMO = dto.coutMO;
      await this.productsRepo.save(p);
      await this.recalcCoutRevient(p.id);
      return this.findOne(p.id);
    }

    return this.productsRepo.save(p);
  }

  async archive(id: number): Promise<Product> {
    await this.findOne(id);
    await this.productsRepo.update(id, { isActive: false });
    return this.findOne(id);
  }

  // ──────────────────────────────────────────────────────────────
  // GESTION BOM
  // ──────────────────────────────────────────────────────────────

  async getBom(productId: number): Promise<BomLine[]> {
    await this.findOne(productId);
    return this.bomRepo.find({
      where: { product: { id: productId } },
      relations: { component: true },
    });
  }

  /**
   * Remplace entièrement la BOM du produit.
   * Opération atomique : suppression + insertion + recalcul coût.
   */
  async setBom(productId: number, dto: SetBomDto): Promise<BomLine[]> {
    const product = await this.findOne(productId);

    // Vérifier que tous les composants existent
    const componentIds = dto.lines.map(l => l.componentId);
    const components = await this.componentsRepo.findBy({ id: In(componentIds) });
    if (components.length !== componentIds.length) {
      const found = components.map(c => c.id);
      const missing = componentIds.filter(id => !found.includes(id));
      throw new NotFoundException(`Composants introuvables : [${missing.join(', ')}]`);
    }

    return this.dataSource.transaction(async (manager) => {
      // Supprimer toutes les lignes existantes
      await manager.delete(BomLine, { product: { id: productId } });

      // Insérer les nouvelles lignes
      const lines = dto.lines.map(l =>
        manager.create(BomLine, {
          product: { id: productId },
          component: { id: l.componentId },
          quantity: l.quantity,
        })
      );
      await manager.save(BomLine, lines);

      // Recalculer dans la même transaction : coût de revient ET prix de vente auto
      const comp = await manager.find(Component, { where: { id: In(componentIds) } });
      const coutMO = Number(product.coutMO);

      const coutComponents  = dto.lines.reduce((sum, line) => {
        const c = comp.find(c => c.id === line.componentId);
        return sum + (line.quantity * Number(c?.prixAchat ?? 0));
      }, 0);
      const venteComponents = dto.lines.reduce((sum, line) => {
        const c = comp.find(c => c.id === line.componentId);
        return sum + (line.quantity * Number(c?.prixVente ?? 0));
      }, 0);

      await manager.update(Product, productId, {
        coutRevient:   coutComponents + coutMO,
        prixVenteAuto: venteComponents + coutMO,
      });

      // Propager aux variantes qui n'ont pas de BOM propre
      const variants = await manager.find(Product, {
        where: { parent: { id: productId }, isActive: true },
        relations: { bomLines: true },
      });
      for (const v of variants) {
        if (v.bomLines.length === 0) {
          await manager.update(Product, v.id, {
            coutRevient:   coutComponents + Number(v.coutMO),
            prixVenteAuto: venteComponents + Number(v.coutMO),
          });
        }
      }

      return manager.find(BomLine, {
        where: { product: { id: productId } },
        relations: { component: true },
      });
    });
  }

  /**
   * Modifie une seule ligne BOM (ajout ou mise à jour).
   */
  async upsertBomLine(productId: number, componentId: number, quantity: number): Promise<BomLine> {
    if (!Number.isInteger(quantity) || quantity <= 0)
      throw new BadRequestException('La quantité doit être un entier positif');
    await this.findOne(productId);
    const component = await this.componentsRepo.findOne({ where: { id: componentId } });
    if (!component) throw new NotFoundException(`Composant #${componentId} introuvable`);

    let line = await this.bomRepo.findOne({
      where: { product: { id: productId }, component: { id: componentId } },
    });

    if (line) {
      line.quantity = quantity;
      await this.bomRepo.save(line);
    } else {
      line = await this.bomRepo.save(this.bomRepo.create({
        product: { id: productId },
        component: { id: componentId },
        quantity,
      }));
    }

    await this.recalcCoutRevient(productId);
    return line;
  }

  async deleteBomLine(productId: number, componentId: number): Promise<void> {
    await this.bomRepo.delete({
      product: { id: productId },
      component: { id: componentId },
    });
    await this.recalcCoutRevient(productId);
  }

  // ──────────────────────────────────────────────────────────────
  // CALCULS AUTOMATIQUES
  // ──────────────────────────────────────────────────────────────

  /**
   * Recalcule le coût de revient ET le prix de vente automatique d'UN produit.
   *
   *   coutRevient  = Σ(qte × prixAchat_composant) + coutMO
   *   prixVenteAuto = Σ(qte × prixVente_composant) + coutMO
   *
   * prixVente (saisi manuellement) n'est PAS touché.
   * La valeur effective à utiliser en facturation :
   *   prixVente > 0 → utiliser prixVente (manuel)
   *   sinon          → utiliser prixVenteAuto (calculé)
   */
  async recalcCoutRevient(productId: number): Promise<void> {
    const product = await this.productsRepo.findOne({
      where: { id: productId },
      relations: { bomLines: { component: true }, parent: true },
    });
    if (!product) return;

    const coutMO = Number(product.coutMO);

    // Si le produit est une variante sans BOM propre → hériter du parent
    if (product.bomLines.length === 0 && product.parent) {
      const parent = await this.productsRepo.findOne({
        where: { id: product.parent.id },
        relations: { bomLines: { component: true } },
      });
      if (parent && parent.bomLines.length > 0) {
        const coutParent = parent.bomLines.reduce(
          (sum, line) => sum + Number(line.quantity) * Number(line.component.prixAchat),
          0,
        );
        const venteParent = parent.bomLines.reduce(
          (sum, line) => sum + Number(line.quantity) * Number(line.component.prixVente),
          0,
        );
        await this.productsRepo.update(productId, {
          coutRevient:   coutParent + coutMO,
          prixVenteAuto: venteParent + coutMO,
        });
        return;
      }
    }

    const coutComponents  = product.bomLines.reduce(
      (sum, line) => sum + Number(line.quantity) * Number(line.component.prixAchat),
      0,
    );
    const venteComponents = product.bomLines.reduce(
      (sum, line) => sum + Number(line.quantity) * Number(line.component.prixVente),
      0,
    );

    await this.productsRepo.update(productId, {
      coutRevient:   coutComponents + coutMO,
      prixVenteAuto: venteComponents + coutMO,
    });
  }

  /**
   * Recalcule coût de revient ET prix de vente auto de TOUS les produits
   * qui utilisent un composant donné.
   * Appelé quand prixAchat OU prixVente d'un composant change.
   */
  async recalcForComponent(componentId: number): Promise<void> {
    const lines = await this.bomRepo.find({
      where: { component: { id: componentId } },
      select: { product: { id: true } },
      relations: { product: true },
    });

    const productIds = [...new Set(lines.map(l => l.product.id))];
    await Promise.all(productIds.map(id => this.recalcCoutRevient(id)));
  }

  // ──────────────────────────────────────────────────────────────
  // DISPONIBILITÉ (stock fabricable)
  // ──────────────────────────────────────────────────────────────

  /**
   * Calcule le stock disponible (nombre d'unités fabricables) pour un produit.
   * stockDisponible = MIN( floor(stock_composant / qte_bom) ) sur tous les composants
   *
   * Si warehouseId fourni → stock de cet entrepôt seulement
   * Sinon → stock total toutes entrepôts
   */
  async getAvailability(productId: number, warehouseId?: number) {
    const bom = await this.getBom(productId);
    if (bom.length === 0) return { stockDisponible: 0, goulot: null, details: [] };

    const details: {
      componentId: number;
      nom: string;
      reference: string;
      qteBom: number;
      stockDispo: number;
      fabricable: number;
      isGoulot: boolean;
    }[] = [];

    let minFabricable = Infinity;
    let goulot: { componentId: number; nom: string; fabricable: number } | null = null;

    for (const line of bom) {
      let stockDispo = 0;

      if (warehouseId) {
        const item = await this.inventoryRepo.findOne({
          where: { warehouse: { id: warehouseId }, component: { id: line.component.id } },
        });
        stockDispo = Number(item?.quantity ?? 0);
      } else {
        const items = await this.inventoryRepo.find({
          where: { component: { id: line.component.id } },
        });
        stockDispo = items.reduce((s, i) => s + Number(i.quantity), 0);
      }

      const fabricable = Math.floor(stockDispo / Number(line.quantity));

      if (fabricable < minFabricable) {
        minFabricable = fabricable;
        goulot = { componentId: line.component.id, nom: line.component.nom, fabricable };
      }

      details.push({
        componentId: line.component.id,
        nom: line.component.nom,
        reference: line.component.reference,
        qteBom: Number(line.quantity),
        stockDispo,
        fabricable,
        isGoulot: false,
      });
    }

    // Marquer le goulot
    if (goulot) {
      const g = details.find(d => d.componentId === goulot!.componentId);
      if (g) g.isGoulot = true;
    }

    return {
      stockDisponible: minFabricable === Infinity ? 0 : minFabricable,
      goulot,
      details,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // SIMULATION DE PRODUCTION
  // ──────────────────────────────────────────────────────────────

  /**
   * Vérifie si on peut produire X unités sans modifier le stock.
   * Retourne les composants manquants si insuffisant.
   */
  async simulate(productId: number, quantity: number, warehouseId: number) {
    if (!Number.isInteger(quantity) || quantity <= 0)
      throw new BadRequestException('La quantité doit être un entier positif');
    const product = await this.findOne(productId);
    const bom = await this.getBom(productId);
    if (bom.length === 0) throw new BadRequestException('Ce produit n\'a pas de nomenclature (BOM)');

    const manquants: { componentId: number; nom: string; requis: number; dispo: number; manque: number }[] = [];
    let coutTotal = 0;
    let canProduce = true;

    for (const line of bom) {
      const requis = Number(line.quantity) * quantity;
      const item = await this.inventoryRepo.findOne({
        where: { warehouse: { id: warehouseId }, component: { id: line.component.id } },
      });
      const dispo = Number(item?.quantity ?? 0);

      coutTotal += requis * Number(line.component.prixAchat);

      if (dispo < requis) {
        canProduce = false;
        manquants.push({
          componentId: line.component.id,
          nom: line.component.nom,
          requis,
          dispo,
          manque: requis - dispo,
        });
      }
    }

    coutTotal += Number(product.coutMO) * quantity;

    return {
      canProduce,
      quantity,
      coutUnitaire: Number(product.coutRevient),
      coutTotal,
      manquants,
    };
  }

  // ──────────────────────────────────────────────────────────────
  // PRODUCTION (transaction atomique)
  // ──────────────────────────────────────────────────────────────

  /**
   * Valide la production de X unités du produit.
   *
   * ÉTAPES (tout dans une transaction — rollback si une étape échoue) :
   * 1. Vérifier la BOM et le stock des composants
   * 2. Pour chaque composant : créer un mouvement OUT + décrémenter inventaire
   * 3. Incrémenter le stock produit fini (table product_inventory)
   * 4. Logger la production avec snapshot du coût (IMMUABLE)
   */
  async produce(productId: number, dto: ProduceDto, userId: number): Promise<ProductionLog> {
    const product = await this.findOne(productId);
    const bom = await this.getBom(productId);

    if (bom.length === 0)
      throw new BadRequestException('Impossible de produire : aucune nomenclature définie');

    const warehouse = await this.warehousesRepo.findOne({ where: { id: dto.warehouseId } });
    if (!warehouse) throw new NotFoundException(`Entrepôt #${dto.warehouseId} introuvable`);

    // Vérifier disponibilité avant d'ouvrir la transaction
    const sim = await this.simulate(productId, dto.quantity, dto.warehouseId);
    if (!sim.canProduce) {
      const missing = sim.manquants.map(m => `${m.nom}: manque ${m.manque}`).join(', ');
      throw new BadRequestException(`Stock insuffisant — ${missing}`);
    }

    return this.dataSource.transaction(async (manager) => {
      // ── ÉTAPE 2 : Décrémenter les composants ─────────────────
      for (const line of bom) {
        const qtRequise = Number(line.quantity) * dto.quantity;

        const item = await manager.findOne(InventoryItem, {
          where: { warehouse: { id: dto.warehouseId }, component: { id: line.component.id } },
        });

        if (!item || Number(item.quantity) < qtRequise)
          throw new BadRequestException(`Stock insuffisant pour ${line.component.nom}`);

        const before = Number(item.quantity);
        const after  = before - qtRequise;

        await manager.update(InventoryItem, item.id, { quantity: after });

        // Mouvement OUT pour traçabilité
        await manager.save(StockMovement, manager.create(StockMovement, {
          warehouse:  { id: dto.warehouseId },
          component:  { id: line.component.id },
          user:       { id: userId },
          type:       MovementType.OUT,
          quantity:   qtRequise,
          quantityBefore: before,
          quantityAfter:  after,
          referenceDoc: `PROD-${productId}`,
          notes: `Production ${product.nom} × ${dto.quantity}`,
        }));
      }

      // ── ÉTAPE 3 : Incrémenter le stock produit fini ───────────
      let productStock = await manager.findOne(ProductInventory, {
        where: { product: { id: productId }, warehouse: { id: dto.warehouseId } },
      });

      if (!productStock) {
        productStock = manager.create(ProductInventory, {
          product:   { id: productId },
          warehouse: { id: dto.warehouseId },
          quantity:  0,
        });
      }

      productStock.quantity = Number(productStock.quantity) + dto.quantity;
      await manager.save(ProductInventory, productStock);

      // ── ÉTAPE 4 : Snapshot du coût (IMMUABLE) ─────────────────
      const coutUnitaireSnapshot = Number(product.coutRevient);
      const coutTotal = coutUnitaireSnapshot * dto.quantity;

      const log = await manager.save(ProductionLog, manager.create(ProductionLog, {
        product:   { id: productId },
        warehouse: { id: dto.warehouseId },
        user:      { id: userId },
        quantity:  dto.quantity,
        coutUnitaireSnapshot,
        coutTotal,
        notes: dto.notes,
      }));

      return log;
    });
  }

  // ──────────────────────────────────────────────────────────────
  // STOCK PRODUIT FINI
  // ──────────────────────────────────────────────────────────────

  async getProductInventory(productId: number): Promise<ProductInventory[]> {
    await this.findOne(productId);
    return this.productInventoryRepo.find({
      where: { product: { id: productId } },
      relations: { warehouse: true },
    });
  }

  /**
   * Transfert de stock produit fini entre entrepôts.
   * Similaire au transfert de composants.
   */
  async transferProductStock(
    productId: number,
    fromWarehouseId: number,
    toWarehouseId: number,
    quantity: number,
    userId: number,
  ): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0)
      throw new BadRequestException('La quantité doit être un entier positif');
    if (fromWarehouseId === toWarehouseId)
      throw new BadRequestException('Source et destination identiques');

    await this.dataSource.transaction(async (manager) => {
      const src = await manager.findOne(ProductInventory, {
        where: { product: { id: productId }, warehouse: { id: fromWarehouseId } },
      });
      if (!src || Number(src.quantity) < quantity)
        throw new BadRequestException('Stock insuffisant dans l\'entrepôt source');

      src.quantity = Number(src.quantity) - quantity;
      await manager.save(ProductInventory, src);

      let dst = await manager.findOne(ProductInventory, {
        where: { product: { id: productId }, warehouse: { id: toWarehouseId } },
      });
      if (!dst) {
        dst = manager.create(ProductInventory, {
          product:   { id: productId },
          warehouse: { id: toWarehouseId },
          quantity:  0,
        });
      }
      dst.quantity = Number(dst.quantity) + quantity;
      await manager.save(ProductInventory, dst);
    });
  }

  // ──────────────────────────────────────────────────────────────
  // HISTORIQUE PRODUCTION
  // ──────────────────────────────────────────────────────────────

  async getProductionLogs(productId: number): Promise<ProductionLog[]> {
    return this.logsRepo.find({
      where: { product: { id: productId } },
      relations: { warehouse: true, user: true },
      order: { producedAt: 'DESC' },
    });
  }
}
