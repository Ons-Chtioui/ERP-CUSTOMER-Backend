import { IsInt, IsPositive, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ProduceDto {
  /** Nombre d'unités à produire */
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  quantity!: number;

  /** Entrepôt où décrementer les composants ET où stocker le produit fini */
  @Type(() => Number)
  @IsInt()
  warehouseId!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
