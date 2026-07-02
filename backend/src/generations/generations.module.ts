import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { GenerationsController } from './generations.controller';
import { GenerationsService } from './generations.service';
import { N8nModule } from '../n8n/n8n.module';

@Module({
  imports: [AuthModule, AiModule, N8nModule],
  controllers: [GenerationsController],
  providers: [GenerationsService],
  exports: [GenerationsService],
})
export class GenerationsModule {}
