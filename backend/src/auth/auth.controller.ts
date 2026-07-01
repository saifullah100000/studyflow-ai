import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { accessToken, user } = await this.authService.login(loginDto);

    response.cookie('access_token', accessToken, this.getCookieOptions());

    return {
      message: 'Login successful',
      user,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'Logged out successfully',
    };
  }

  private getCookieOptions(): CookieOptions {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    const expiresInSeconds = Number(
      this.configService.get<string>('JWT_EXPIRES_IN_SECONDS') ?? 3600,
    );

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: expiresInSeconds * 1000,
      path: '/',
    };
  }
}
