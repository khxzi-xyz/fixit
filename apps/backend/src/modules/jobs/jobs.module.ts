import { Module } from '@nestjs/common';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { ModerationModule } from '../moderation/moderation.module';
import { RoutingModule } from '../routing/routing.module';
import { AiModule } from '../ai/ai.module';
import { DraftsController, DraftsService } from './drafts.controller';

@Module({
  imports: [ModerationModule, RoutingModule, AiModule],
  controllers: [JobsController, DraftsController],
  providers: [JobsService, DraftsService],
  exports: [JobsService],
})
export class JobsModule {}
