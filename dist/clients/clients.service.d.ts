import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
export declare class ClientsService {
    private readonly repo;
    constructor(repo: Repository<Client>);
    private generateCode;
    create(dto: CreateClientDto): Promise<Client>;
    findAll(search?: string): Promise<Client[]>;
    findOne(id: string): Promise<Client>;
    update(id: string, dto: UpdateClientDto): Promise<Client>;
    remove(id: string): Promise<void>;
    toggle(id: string): Promise<Client>;
}
