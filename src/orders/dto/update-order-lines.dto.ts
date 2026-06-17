// src/orders/dto/update-order-lines.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateOrderDto } from './create-order.dto';

// Utilisé pour mettre à jour les lignes d'une commande en DRAFT
export class UpdateOrderLinesDto extends PartialType(CreateOrderDto) {}