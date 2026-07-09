import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { BidsModule } from './modules/bids/bids.module';
import { RoutingModule } from './modules/routing/routing.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ChatModule } from './modules/chat/chat.module';
import { TelephonyModule } from './modules/telephony/telephony.module';
import { WarrantyModule } from './modules/warranty/warranty.module';
import { AiModule } from './modules/ai/ai.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { LiveMapModule } from './modules/livemap/livemap.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { BountyModule } from './modules/bounty/bounty.module';
import { CompletionModule } from './modules/completion/completion.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StorageModule } from './modules/storage/storage.module';
import { BillingModule } from './modules/billing/billing.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { VendorOpsModule } from './modules/vendorops/vendorops.module';
import { TranslationModule } from './modules/translation/translation.module';
import { SystemLogsModule } from './modules/systemlogs/systemlogs.module';
import { AdminModule } from './modules/admin/admin.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { AdsModule } from './modules/ads/ads.module';
import { StoreModule } from './modules/store/store.module';
import { EmergencyModule } from './modules/emergency/emergency.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { FeedModule } from './modules/feed/feed.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // load the monorepo-root .env (three levels up from apps/backend/dist)
      envFilePath: [join(__dirname, '..', '..', '..', '.env')],
    }),
    SupabaseModule,
    WhatsAppModule,
    AuthModule,
    VendorsModule,
    JobsModule,
    BidsModule,
    RoutingModule,
    EscrowModule,
    ModerationModule,
    RealtimeModule,
    ChatModule,
    TelephonyModule,
    WarrantyModule,
    // master_specs build-out (v1.0 + v2.0)
    AiModule,
    WalletModule,
    LiveMapModule,
    CatalogModule,
    BountyModule,
    CompletionModule,
    MarketplaceModule,
    SettingsModule,
    StorageModule,
    BillingModule,
    DisputesModule,
    EngagementModule,
    OnboardingModule,
    VendorOpsModule,
    TranslationModule,
    SystemLogsModule,
    AdminModule,
    RewardsModule,
    AdsModule,
    StoreModule,
    EmergencyModule,
    MaintenanceModule,
    FeedModule,
    FavoritesModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
