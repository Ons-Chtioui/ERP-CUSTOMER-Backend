// src/clients/dto/create-client.dto.ts
import {
  IsString,
  IsEmail,
  IsOptional,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
   @IsEmail()
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  tvaNumber?: string;
}