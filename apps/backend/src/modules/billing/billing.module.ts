import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { VoucherService } from './voucher.service';
import { BillingController } from './billing.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [BillingController],
  providers: [BillingService, VoucherService],
  exports: [BillingService, VoucherService],
})
export class BillingModule {}
