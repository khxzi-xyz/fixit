import { Module, forwardRef } from '@nestjs/common';
import { CompletionService } from './completion.service';
import { CompletionController } from './completion.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { WarrantyModule } from '../warranty/warranty.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [RealtimeModule, WarrantyModule, RewardsModule],
  controllers: [CompletionController],
  providers: [CompletionService],
  exports: [CompletionService],
})
export class CompletionModule {}
