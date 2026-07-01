import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class ListNotesQueryDto {
  @Type(() => Number)
  @IsInt({
    message: 'Page must be a whole number',
  })
  @Min(1, {
    message: 'Page must be at least 1',
  })
  page = 1;

  @Type(() => Number)
  @IsInt({
    message: 'Limit must be a whole number',
  })
  @Min(1, {
    message: 'Limit must be at least 1',
  })
  @Max(50, {
    message: 'Limit cannot exceed 50',
  })
  limit = 10;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({
    message: 'Title search must be text',
  })
  @MaxLength(200)
  title?: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({
    message: 'Subject search must be text',
  })
  @MaxLength(120)
  subject?: string;
}
