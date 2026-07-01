import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  EducationLevel,
  GenerationLanguage,
  NotesLength,
} from '../../generated/prisma/client';

export class CreateGenerationDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Topic must be text' })
  @MinLength(3, {
    message: 'Topic must contain at least 3 characters',
  })
  @MaxLength(200, {
    message: 'Topic cannot exceed 200 characters',
  })
  topic!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Subject must be text' })
  @MinLength(2, {
    message: 'Subject must contain at least 2 characters',
  })
  @MaxLength(120, {
    message: 'Subject cannot exceed 120 characters',
  })
  subject!: string;

  @IsEnum(EducationLevel, {
    message:
      'Education level must be SCHOOL, COLLEGE, UNIVERSITY or PROFESSIONAL',
  })
  educationLevel!: EducationLevel;

  @IsEnum(GenerationLanguage, {
    message: 'Language must be ENGLISH or URDU',
  })
  language!: GenerationLanguage;

  @IsEnum(NotesLength, {
    message: 'Notes length must be SHORT, MEDIUM or LONG',
  })
  notesLength!: NotesLength;

  @Type(() => Number)
  @IsInt({
    message: 'Number of MCQs must be a whole number',
  })
  @Min(0, {
    message: 'Number of MCQs cannot be less than 0',
  })
  @Max(50, {
    message: 'Number of MCQs cannot exceed 50',
  })
  numberOfMcqs!: number;

  @Type(() => Number)
  @IsInt({
    message: 'Number of flashcards must be a whole number',
  })
  @Min(0, {
    message: 'Number of flashcards cannot be less than 0',
  })
  @Max(50, {
    message: 'Number of flashcards cannot exceed 50',
  })
  numberOfFlashcards!: number;

  @IsBoolean({
    message: 'Include practical examples must be true or false',
  })
  includePracticalExamples!: boolean;

  @IsBoolean({
    message: 'Send to WhatsApp must be true or false',
  })
  sendToWhatsapp!: boolean;
}
