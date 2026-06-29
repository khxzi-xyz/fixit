import { Module } from '@nestjs/common';
import { WarrantyService } from './warranty.service';
import { WarrantyController } from './warranty.controller';
import { PayoutService } from './payout.service';
import { PartsFundingService } from './parts-funding.service';
import { PartsFundingController } from './parts-funding.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [WarrantyController, PartsFundingController],
  providers: [WarrantyService, PayoutService, PartsFundingService],
  exports: [WarrantyService, PayoutService, PartsFundingService],
})
export class WarrantyModule {}
