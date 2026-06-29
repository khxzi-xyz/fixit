import { Module } from '@nestjs/common';
import { BidsService } from './bids.service';
import { BidsController } from './bids.controller';
import { EscrowModule } from '../escrow/escrow.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AiModule } from '../ai/ai.module';
import { BountyModule } from '../bounty/bounty.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [EscrowModule, RealtimeModule, AiModule, BountyModule, WalletModule],
  controllers: [BidsController],
  providers: [BidsService],
  exports: [BidsService],
})
export class BidsModule {}
