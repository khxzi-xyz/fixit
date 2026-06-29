import { Module } from '@nestjs/common';
import { VendorOpsService } from './vendorops.service';
import { VendorOpsController } from './vendorops.controller';

@Module({
  controllers: [VendorOpsController],
  providers: [VendorOpsService],
  exports: [VendorOpsService],
})
export class VendorOpsModule {}
