import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { ModerationModule } from '../moderation/moderation.module';
import { RoutingModule } from '../routing/routing.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ModerationModule, RoutingModule, AiModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
