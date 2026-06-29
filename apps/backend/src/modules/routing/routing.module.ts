import { Module } from '@nestjs/common';
import { RoutingService } from './routing.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  providers: [RoutingService],
  exports: [RoutingService],
})
export class RoutingModule {}
