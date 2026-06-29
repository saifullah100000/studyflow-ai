import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Name must be text' })
  @MinLength(2, { message: 'Name must contain at least 2 characters' })
  @MaxLength(60, { message: 'Name cannot exceed 60 characters' })
  name!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(120, { message: 'Email cannot exceed 120 characters' })
  email!: string;

  @IsString({ message: 'Password must be text' })
  @MinLength(8, { message: 'Password must contain at least 8 characters' })
  @MaxLength(64, { message: 'Password cannot exceed 64 characters' })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/[0-9]/, {
    message: 'Password must contain at least one number',
  })
  password!: string;
}
