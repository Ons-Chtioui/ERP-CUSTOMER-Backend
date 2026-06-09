import {
  IsEmail, IsString, IsInt, IsOptional,
  IsArray, MinLength, Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  nom: string;

  @IsString()
  prenom: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mot de passe : min 8 cars, 1 majuscule, 1 minuscule, 1 chiffre',
  })
  password?: string;

  @IsInt()
  roleId: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[];
}