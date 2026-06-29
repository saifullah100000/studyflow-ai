import { ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const name = registerDto.name.trim();
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const rounds = Number(
      this.configService.get<string>('BCRYPT_ROUNDS') ?? 10,
    );

    const passwordHash = await bcrypt.hash(registerDto.password, rounds);

    const user = await this.usersService.create({
      name,
      email,
      passwordHash,
    });

    return {
      message: 'Account created successfully',
      user,
    };
  }
}
