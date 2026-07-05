import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { SupportChatService } from './support-chat.service';
import { StorageModule } from '../storage/storage.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [StorageModule, RealtimeModule, AiModule],
  controllers: [OnboardingController],
  providers: [OnboardingService, SupportChatService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
