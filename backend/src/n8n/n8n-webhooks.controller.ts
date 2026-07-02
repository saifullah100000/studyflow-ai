import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  N8nCompletedCallbackDto,
  N8nFailedCallbackDto,
  N8nProcessingCallbackDto,
} from './dto/n8n-callback.dto';
import { N8nCallbackGuard } from './n8n-callback.guard';
import { N8nCallbacksService } from './n8n-callbacks.service';

@Controller('webhooks/n8n')
@UseGuards(N8nCallbackGuard)
export class N8nWebhooksController {
  constructor(private readonly callbacksService: N8nCallbacksService) {}

  @Post('processing')
  @HttpCode(HttpStatus.OK)
  markProcessing(@Body() callbackDto: N8nProcessingCallbackDto) {
    return this.callbacksService.markProcessing(callbackDto);
  }

  @Post('completed')
  @HttpCode(HttpStatus.OK)
  complete(@Body() callbackDto: N8nCompletedCallbackDto) {
    return this.callbacksService.complete(callbackDto);
  }

  @Post('failed')
  @HttpCode(HttpStatus.OK)
  fail(@Body() callbackDto: N8nFailedCallbackDto) {
    return this.callbacksService.fail(callbackDto);
  }
}
