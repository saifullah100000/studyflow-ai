import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { PublicUser } from '../users/users.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

interface LoginResult {
  accessToken: string;
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const name = registerDto.name.trim();
    const email = registerDto.email.trim().toLowerCase();

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

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

  async login(loginDto: LoginDto): Promise<LoginResult> {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordIsValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }
}
