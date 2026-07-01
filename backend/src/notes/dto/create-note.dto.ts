import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { NoteSectionInputDto } from './note-section-input.dto';

export class CreateNoteDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Title must be text' })
  @MinLength(1, {
    message: 'Title cannot be empty',
  })
  @MaxLength(200, {
    message: 'Title cannot exceed 200 characters',
  })
  title!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'Topic must be text' })
  @MaxLength(120, {
    message: 'Topic cannot exceed 120 characters',
  })
  topic?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'Summary must be text' })
  @MaxLength(5000, {
    message: 'Summary cannot exceed 5000 characters',
  })
  summary?: string | null;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString({ message: 'Content must be text' })
  @MaxLength(100000, {
    message: 'Content cannot exceed 100000 characters',
  })
  content?: string | null;

  @IsOptional()
  @IsArray({
    message: 'Sections must be an array',
  })
  @ArrayMaxSize(100, {
    message: 'A note cannot contain more than 100 sections',
  })
  @ValidateNested({ each: true })
  @Type(() => NoteSectionInputDto)
  sections?: NoteSectionInputDto[];
}
