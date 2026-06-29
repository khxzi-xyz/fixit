import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { GeminiClient } from './gemini.client';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [ModerationController],
  providers: [ModerationService, GeminiClient],
  exports: [ModerationService],
})
export class ModerationModule {}
