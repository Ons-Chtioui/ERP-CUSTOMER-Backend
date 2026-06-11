import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString()
  @MaxLength(100)
  nom!: string;

  /** Code couleur HEX — ex: "#3B82F6" */
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'couleur doit être un code HEX valide (#RRGGBB)' })
  couleur?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
