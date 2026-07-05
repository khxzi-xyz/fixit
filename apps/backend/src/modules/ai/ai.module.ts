import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { GeminiClient } from '../moderation/gemini.client';
import { AiProviderService } from './ai-provider.service';

@Module({
  controllers: [AiController],
  providers: [AiService, GeminiClient, AiProviderService],
  exports: [AiService, AiProviderService],
})
export class AiModule {}
