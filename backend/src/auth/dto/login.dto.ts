import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @MaxLength(120, { message: 'Email cannot exceed 120 characters' })
  email!: string;

  @IsString({ message: 'Password must be text' })
  @MinLength(1, { message: 'Password is required' })
  @MaxLength(64, { message: 'Password cannot exceed 64 characters' })
  password!: string;
}
