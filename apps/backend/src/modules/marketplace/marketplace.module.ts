import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { HighTicketService } from './highticket.service';
import { DiagnosticsService } from './diagnostics.service';
import { JunkService } from './junk.service';
import { MarketplaceController } from './marketplace.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { WalletModule } from '../wallet/wallet.module';

/**
 * The "open trading platform" layer (master_specs v2.0): goods (M19),
 * high-ticket lead-lock (M20), workshop diagnostics (M18), junk auctions (M22).
 * All share the WalletService for escrow holds/releases.
 */
@Module({
  imports: [RealtimeModule, WalletModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService, HighTicketService, DiagnosticsService, JunkService],
  exports: [MarketplaceService, HighTicketService, DiagnosticsService, JunkService],
})
export class MarketplaceModule {}
