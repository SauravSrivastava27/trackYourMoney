import { Transform } from 'class-transformer';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name!: string;

  @IsIn(['INCOME', 'EXPENSE'])
  type!: 'INCOME' | 'EXPENSE';
}