import { IsArray, ValidateNested, IsInt, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class BomLineDto {
  @Type(() => Number)
  @IsInt()
  componentId!: number;

  /** Quantité nécessaire pour fabriquer 1 unité */
  @Type(() => Number)
  @IsPositive()
  quantity!: number;
}

/**
 * Remplace entièrement la BOM d'un produit.
 * Toutes les lignes existantes sont supprimées, puis celles-ci sont insérées.
 */
export class SetBomDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomLineDto)
  lines!: BomLineDto[];
}
