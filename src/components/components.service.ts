import {
  Injectable, NotFoundException, ConflictException, Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Component } from './entities/component.entity';
import { Category } from './entities/category.entity';
import { Supplier } from './entities/supplier.entity';
import { InventoryItem } from './entities/inventory-item.entity';
import { CreateComponentDto } from './dto/create-component.dto';
import type { ProductsService } from '../products/products.service';

/** Génère un EAN-13 valide à partir d'un préfixe 2xx (usage interne) */
function generateEAN13(): string {
  const prefix = '619'; // Préfixe interne TN
  const body = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  const digits = prefix + body;
  // Calcul du chiffre de contrôle EAN-13
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return digits + check;
}
@Injectable()
export class ComponentsService {
  /** Injecté via setProductsService() pour éviter la dépendance circulaire */
  private productsService?: ProductsService;

  setProductsService(svc: ProductsService) {
    this.productsService = svc;
  }

    constructor(
        @InjectRepository(Component)
        private readonly componentsRepo: Repository<Component>,
        @InjectRepository(Category)
        private readonly categoriesRepo: Repository<Category>,
        @InjectRepository(Supplier)
        private readonly suppliersRepo: Repository<Supplier>,
        @InjectRepository(InventoryItem)
        private readonly inventoryRepo: Repository<InventoryItem>,
    ){}

    async findAll(filter: { search?:string;categoryId?: number; supplierId?: number }): Promise<Component[]> {
    const pd=this.componentsRepo.createQueryBuilder('component')
    .leftJoinAndSelect('component.category', 'category')
    .leftJoinAndSelect('component.supplier', 'supplier')
    .where('component.is_active = true')
   
    if(filter?.search){
    pd.andWhere('(component.nom ILIKE :search OR component.reference ILIKE :search)', { search: `%${filter.search}%` });
    }    
    if(filter?.categoryId){
        pd.andWhere('component.category_id = :catId', { catId: filter.categoryId });
    }
    if(filter?.supplierId){
        pd.andWhere('component.supplier_id = :supId', { supId: filter.supplierId });    
    }
    return pd.orderBy('component.nom','ASC').getMany();
}
async findOne(id: number): Promise<Component> {
    const c = await this.componentsRepo.findOne({
      where: { id }, relations: { category: true, supplier: true },
    });
    if (!c) throw new NotFoundException(`Composant #${id} introuvable`);
    return c;
}
async findByBarcode(barcode: string): Promise<Component> {
  const c = await this.componentsRepo.findOne({
    where: { barcode },
    relations: { category: true, supplier: true },
  });
  if (!c) throw new NotFoundException(`Aucun composant avec le code-barres "${barcode}"`);
  return c;
}

async findByReference(ref: string): Promise<Component> {
const c=await this.componentsRepo.findOne({
    where: { reference: ref }, relations: { category: true, supplier: true },
});
if (!c) throw new NotFoundException(`Composant avec référence "${ref}" introuvable`);
return c;       
}
async create(dto: CreateComponentDto): Promise<Component> {
     const existing = await this.componentsRepo.findOne({ where: { reference: dto.reference } });
    if (existing) throw new ConflictException(`La référence "${dto.reference}" est déjà utilisée`);
    let category: Category | null = null;
    if (dto.categoryId) {
        category = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });        
        if (!category) throw new NotFoundException(`Catégorie #${dto.categoryId} introuvable`);
    }
    let supplier: Supplier | null = null;    
    if (dto.supplierId) {
        supplier = await this.suppliersRepo.findOne({ where: { id: dto.supplierId } });
        if (!supplier) throw new NotFoundException(`Fournisseur #${dto.supplierId} introuvable`);
    }

    // Générer un barcode EAN-13 unique si non fourni
    let barcode = dto.barcode;
    if (!barcode) {
      let unique = false;
      while (!unique) {
        barcode = generateEAN13();
        const dup = await this.componentsRepo.findOne({ where: { barcode } });
        if (!dup) unique = true;
      }
    }

    return this.componentsRepo.save(
      this.componentsRepo.create({
        ...dto,
        barcode,
        category: category ?? undefined,
        supplier: supplier ?? undefined,
      })
    );
}
async update(id: number, dto: Partial<CreateComponentDto>): Promise<Component> {
    const c = await this.findOne(id);
    if (dto.reference && dto.reference !== c.reference) {
      const existing = await this.componentsRepo.findOne({ where: { reference: dto.reference } });
      if (existing) throw new ConflictException(`Référence "${dto.reference}" déjà utilisée`);
    }
    if (dto.categoryId) {
      const category = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException(`Catégorie #${dto.categoryId} introuvable`);
      c.category = category;
    }
    if (dto.supplierId) {
      const supplier = await this.suppliersRepo.findOne({ where: { id: dto.supplierId } });
      if (!supplier) throw new NotFoundException(`Fournisseur #${dto.supplierId} introuvable`);
      c.supplier = supplier;
    }
    Object.assign(c, dto);
    const saved = await this.componentsRepo.save(c);

    // Si prixAchat OU prixVente a changé → recalculer coût/prix de TOUS les produits liés
    if ((dto.prixAchat !== undefined || dto.prixVente !== undefined) && this.productsService) {
      this.productsService.recalcForComponent(id).catch(() => {});
    }

    return saved;
  }

  async deactivate(id: number): Promise<Component> {
    const c = await this.findOne(id);
    c.isActive = false;
    return this.componentsRepo.save(c);
  }

  async updateImageUrl(id: number, imageUrl: string): Promise<Component> {
    await this.componentsRepo.update(id, { imageUrl });
    return this.findOne(id);
  }
async getStockSummary(componentId: number) {
    const component = await this.findOne(componentId);
    const items = await this.inventoryRepo.find({
      where: { component: { id: componentId } },
      relations: { warehouse: true },
    });
    const totalQuantity = items.reduce((s, i) => s + Number(i.quantity), 0);
    return {
      componentId,
      totalQuantity,
      isLowStock: totalQuantity <= component.seuilAlerte,
      threshold: component.seuilAlerte,
      byWarehouse: items.map((i) => ({
        warehouse: i.warehouse,
        quantity: Number(i.quantity),
        reservedQty: Number(i.reservedQty),
        available: Number(i.quantity) - Number(i.reservedQty),
      })),
    };
  }
async findAllCategories(): Promise<Category[]> {
    return this.categoriesRepo.find({ order: { nom: 'ASC' } });
  }
async createCategory(nom: string,description?:string): Promise<Category> {
    return this.categoriesRepo.save(this.categoriesRepo.create({ nom, description }));
  }

   async findAllSuppliers() {
    return this.suppliersRepo.find({ where: { isActive: true }, order: { nom: 'ASC' } });
  }

  async createSupplier(data: Partial<Supplier>) {
    return this.suppliersRepo.save(this.suppliersRepo.create(data));
  }
}
