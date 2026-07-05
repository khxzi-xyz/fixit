import { Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { CouponsService } from './coupons.service';
import { SupabaseModule } from '../../supabase/supabase.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [SupabaseModule, WalletModule],
  controllers: [RewardsController],
  providers: [RewardsService, CouponsService],
  exports: [RewardsService, CouponsService],
})
export class RewardsModule {}
