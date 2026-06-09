import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Format email invalide' })
    email!: string;

  @IsString()
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
    password!: string;
}