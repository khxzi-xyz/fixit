import { Module } from '@nestjs/common';
import { AdsController, AdvertiseController } from './ads.controller';

@Module({
  controllers: [AdsController, AdvertiseController],
})
export class AdsModule {}
