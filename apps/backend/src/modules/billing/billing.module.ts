import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { VoucherService } from './voucher.service';
import { PaymentMethodsService } from './payment-methods.service';
import { BillingController } from './billing.controller';
import { WalletModule } from '../wallet/wallet.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [WalletModule, RewardsModule],
  controllers: [BillingController],
  providers: [BillingService, VoucherService, PaymentMethodsService],
  exports: [BillingService, VoucherService, PaymentMethodsService],
})
export class BillingModule {}
