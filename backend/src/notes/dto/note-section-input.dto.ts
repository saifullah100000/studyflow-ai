import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class NoteSectionInputDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Section heading must be text' })
  @MinLength(1, {
    message: 'Section heading cannot be empty',
  })
  @MaxLength(200, {
    message: 'Section heading cannot exceed 200 characters',
  })
  heading!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Section content must be text' })
  @MinLength(1, {
    message: 'Section content cannot be empty',
  })
  @MaxLength(20000, {
    message: 'Section content cannot exceed 20000 characters',
  })
  content!: string;
}
