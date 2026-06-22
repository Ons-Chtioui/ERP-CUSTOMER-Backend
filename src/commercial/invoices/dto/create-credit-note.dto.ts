import { IsOptional, IsString } from 'class-validator';

export class CreateCreditNoteDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
