import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = request.cookies?.access_token as unknown;

    if (typeof token !== 'string' || token.length === 0) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

      request.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Session expired or invalid');
    }
  }
}
