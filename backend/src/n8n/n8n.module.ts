import { Module } from '@nestjs/common';
import { N8nCallbackGuard } from './n8n-callback.guard';
import { N8nCallbacksService } from './n8n-callbacks.service';
import { N8nService } from './n8n.service';
import { N8nWebhooksController } from './n8n-webhooks.controller';

@Module({
  controllers: [N8nWebhooksController],
  providers: [N8nService, N8nCallbacksService, N8nCallbackGuard],
  exports: [N8nService],
})
export class N8nModule {}
