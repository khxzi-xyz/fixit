import { Module } from '@nestjs/common';
import { TelephonyService } from './telephony.service';
import { TelephonyController } from './telephony.controller';
import { TwilioClient } from './twilio.client';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [TelephonyController],
  providers: [TelephonyService, TwilioClient],
  exports: [TelephonyService],
})
export class TelephonyModule {}
