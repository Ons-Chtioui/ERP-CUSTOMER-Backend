import { DeliveryNotesService } from './delivery-notes.service';
import { CreateDeliveryNoteDto } from './dto/create-delivery-note.dto';
import { DeliverDto } from './dto/deliver.dto';
import { DeliveryStatus } from './entities/delivery-note.entity';
export declare class DeliveryNotesController {
    private readonly service;
    constructor(service: DeliveryNotesService);
    create(dto: CreateDeliveryNoteDto, req: any): Promise<import("./entities/delivery-note.entity").DeliveryNote>;
    findAll(clientId?: string, status?: DeliveryStatus): Promise<import("./entities/delivery-note.entity").DeliveryNote[]>;
    findOne(id: number): Promise<import("./entities/delivery-note.entity").DeliveryNote>;
    markDelivered(id: number, dto: DeliverDto): Promise<import("./entities/delivery-note.entity").DeliveryNote>;
    remove(id: number): Promise<void>;
}
