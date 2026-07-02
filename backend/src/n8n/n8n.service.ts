import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { N8nDispatchResult, N8nGenerationPayload } from './n8n.types';

@Injectable()
export class N8nService {
  private readonly logger = new Logger(N8nService.name);
  private readonly enabled: boolean;
  private readonly webhookUrl: string;
  private readonly webhookSecret: string;
  private readonly timeoutMs: number;

  constructor(private readonly configService: ConfigService) {
    this.enabled =
      (
        this.configService.get<string>('N8N_ENABLED') ?? 'true'
      ).toLowerCase() === 'true';

    this.webhookUrl = this.enabled
      ? this.configService.getOrThrow<string>('N8N_WEBHOOK_URL')
      : '';

    this.webhookSecret = this.enabled
      ? this.configService.getOrThrow<string>('N8N_WEBHOOK_SECRET')
      : '';

    const configuredTimeout = Number(
      this.configService.get<string>('N8N_TIMEOUT_MS') ?? 10000,
    );

    this.timeoutMs =
      Number.isInteger(configuredTimeout) &&
      configuredTimeout >= 1000 &&
      configuredTimeout <= 60000
        ? configuredTimeout
        : 10000;
  }

  async sendGenerationRequest(
    payload: N8nGenerationPayload,
  ): Promise<N8nDispatchResult> {
    if (!this.enabled) {
      return {
        accepted: false,
        skipped: true,
        message: 'n8n dispatch is disabled',
        jobId: payload.jobId,
        requestId: payload.requestId,
      };
    }

    const controller = new AbortController();

    const timeoutHandle = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'x-studyflow-secret': this.webhookSecret,
        },

        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const responseText = await response.text();

      if (!response.ok) {
        this.logger.error(`n8n returned HTTP ${response.status}`);

        throw new ServiceUnavailableException(
          'The automation service rejected the generation request',
        );
      }

      if (!responseText) {
        throw new BadGatewayException('n8n returned an empty response');
      }

      let responseBody: unknown;

      try {
        responseBody = JSON.parse(responseText);
      } catch {
        throw new BadGatewayException('n8n returned invalid JSON');
      }

      if (typeof responseBody !== 'object' || responseBody === null) {
        throw new BadGatewayException('n8n returned an invalid response');
      }

      const result = responseBody as Record<string, unknown>;

      if (result.status === 'FAILED') {
        throw new BadGatewayException(
          typeof result.message === 'string'
            ? result.message
            : 'n8n generation workflow failed',
        );
      }

      if (result.accepted !== true || result.jobId !== payload.jobId) {
        throw new BadGatewayException(
          'n8n did not acknowledge the correct generation job',
        );
      }

      return {
        accepted: true,
        skipped: false,
        message:
          typeof result.message === 'string'
            ? result.message
            : 'Generation workflow completed',
        jobId: payload.jobId,
        requestId:
          typeof result.requestId === 'string'
            ? result.requestId
            : payload.requestId,
        status: result.status === 'COMPLETED' ? 'COMPLETED' : undefined,
        noteId: typeof result.noteId === 'string' ? result.noteId : undefined,
      };
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GatewayTimeoutException('n8n did not respond in time');
      }

      this.logger.error(
        `Could not contact n8n: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );

      throw new ServiceUnavailableException(
        'The automation service is unavailable',
      );
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
