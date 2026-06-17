import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
export declare class ClientsController {
    private readonly service;
    constructor(service: ClientsService);
    create(dto: CreateClientDto): Promise<import("./entities/client.entity").Client>;
    findAll(search?: string): Promise<import("./entities/client.entity").Client[]>;
    findOne(id: string): Promise<import("./entities/client.entity").Client>;
    update(id: string, dto: UpdateClientDto): Promise<import("./entities/client.entity").Client>;
    toggle(id: string): Promise<import("./entities/client.entity").Client>;
    remove(id: string): Promise<void>;
}
