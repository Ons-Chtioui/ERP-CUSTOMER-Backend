import {
  IsString, IsOptional, IsNumber, IsInt,
  Min, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @MaxLength(150)
  nom!: string;

  @IsString()
  @MaxLength(80)
  reference!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unite?: string;

  /**
   * Prix de vente MANUEL (prioritaire sur prixVenteAuto si > 0).
   * Laisser à 0 pour utiliser le prix calculé automatiquement.
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  prixVente?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  coutMO?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  seuilAlerte?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  /** ID du produit parent (variantes — max 2 niveaux) */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  parentId?: number;
}
