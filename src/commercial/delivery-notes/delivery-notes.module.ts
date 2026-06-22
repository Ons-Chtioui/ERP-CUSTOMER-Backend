import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryNotesService } from './delivery-notes.service';
import { DeliveryNotesController } from './delivery-notes.controller';
import { DeliveryNote } from './entities/delivery-note.entity';
import { DeliveryNoteLine } from './entities/delivery-note-line.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryNote, DeliveryNoteLine]),
  ],
  providers: [DeliveryNotesService],
  controllers: [DeliveryNotesController],
  exports: [DeliveryNotesService],
})
export class DeliveryNotesModule {}