import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly repo: Repository<Client>,
  ) {}

  private async generateCode(): Promise<string> {
    const count = await this.repo.count();
    return `CLI-${String(count + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateClientDto): Promise<Client> {
    if (dto.email) {
      const existing = await this.repo.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException(`Email "${dto.email}" déjà utilisé`);
    }
    return this.repo.save(this.repo.create({ ...dto, code: await this.generateCode() }));
  }

  async findAll(search?: string): Promise<Client[]> {
    if (search) {
      return this.repo.find({
        where: [
          { name: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { code: ILike(`%${search}%`) },
        ],
        order: { name: 'ASC' },
      });
    }
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.repo.findOne({ where: { id } });
    if (!client) throw new NotFoundException(`Client #${id} introuvable`);
    return client;
  }

  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findOne(id);
    if (dto.email && dto.email !== client.email) {
      const existing = await this.repo.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException(`Email "${dto.email}" déjà utilisé`);
    }
    Object.assign(client, dto);
    return this.repo.save(client);
  }

  async remove(id: string): Promise<void> {
    const client = await this.findOne(id);
    await this.repo.remove(client);
  }

  async toggle(id: string): Promise<Client> {
    const client = await this.findOne(id);
    client.isActive = !client.isActive;
    return this.repo.save(client);
  }
}
