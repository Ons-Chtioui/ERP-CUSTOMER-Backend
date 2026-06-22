import { Repository } from 'typeorm';
import { DeliveryNote, DeliveryStatus } from './entities/delivery-note.entity';
import { DeliveryNoteLine } from './entities/delivery-note-line.entity';
import { CreateDeliveryNoteDto } from './dto/create-delivery-note.dto';
import { DeliverDto } from './dto/deliver.dto';
import { Order } from '../../orders/entities/order.entity';
export declare class DeliveryNotesService {
    private repo;
    private lineRepo;
    constructor(repo: Repository<DeliveryNote>, lineRepo: Repository<DeliveryNoteLine>);
    private generateReference;
    create(dto: CreateDeliveryNoteDto, userId: number): Promise<DeliveryNote>;
    createFromOrder(order: Order, userId: number): Promise<DeliveryNote | null>;
    findAll(params?: {
        clientId?: number;
        status?: DeliveryStatus;
    }): Promise<DeliveryNote[]>;
    findOne(id: number): Promise<DeliveryNote>;
    markDelivered(id: number, dto: DeliverDto): Promise<DeliveryNote>;
    remove(id: number): Promise<void>;
}
