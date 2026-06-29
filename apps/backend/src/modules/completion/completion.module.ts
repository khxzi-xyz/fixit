import { Module } from '@nestjs/common';
import { CompletionService } from './completion.service';
import { CompletionController } from './completion.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { WarrantyModule } from '../warranty/warranty.module';

@Module({
  imports: [RealtimeModule, WarrantyModule],
  controllers: [CompletionController],
  providers: [CompletionService],
  exports: [CompletionService],
})
export class CompletionModule {}
