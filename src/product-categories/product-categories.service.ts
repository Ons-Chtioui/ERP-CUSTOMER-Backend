import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductCategory } from './entities/product-category.entity';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';

@Injectable()
export class ProductCategoriesService {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly repo: Repository<ProductCategory>,
  ) {}

  findAll(): Promise<ProductCategory[]> {
    return this.repo.find({ order: { nom: 'ASC' } });
  }

  async findOne(id: number): Promise<ProductCategory> {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException(`Catégorie #${id} introuvable`);
    return cat;
  }

  async create(dto: CreateProductCategoryDto): Promise<ProductCategory> {
    return this.repo.save(this.repo.create({
      nom: dto.nom,
      couleur: dto.couleur ?? '#6366F1',
      description: dto.description,
    }));
  }

  async update(id: number, dto: Partial<CreateProductCategoryDto>): Promise<ProductCategory> {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.repo.delete(id);
  }
}
