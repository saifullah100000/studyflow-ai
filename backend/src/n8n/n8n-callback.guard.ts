import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class N8nCallbackGuard implements CanActivate {
  private readonly callbackSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.callbackSecret = this.configService.getOrThrow<string>(
      'N8N_CALLBACK_SECRET',
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const suppliedSecret = request.header('x-studyflow-callback-secret');

    if (
      !suppliedSecret ||
      !this.secretsMatch(suppliedSecret, this.callbackSecret)
    ) {
      throw new UnauthorizedException('Invalid n8n callback credentials');
    }

    return true;
  }

  private secretsMatch(
    suppliedSecret: string,
    expectedSecret: string,
  ): boolean {
    const suppliedBuffer = Buffer.from(suppliedSecret);
    const expectedBuffer = Buffer.from(expectedSecret);

    if (suppliedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(suppliedBuffer, expectedBuffer);
  }
}
