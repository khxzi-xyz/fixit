import { Module } from '@nestjs/common';
import { LiveMapService } from './livemap.service';
import { LiveMapController } from './livemap.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [LiveMapController],
  providers: [LiveMapService],
  exports: [LiveMapService],
})
export class LiveMapModule {}
