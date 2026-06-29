import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { WalletService } from '../wallet/wallet.service';

/**
 * Subscriptions (master_specs Module 09 / v2.0 tiers). Plus for consumers, Pro/
 * Elite for vendors — 3 OMR (Plus/Pro), 7 OMR (Elite). The monthly fee is paid
 * from the wallet; the plan binds for 30 days.
 */
@Injectable()
export class BillingService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly wallet: WalletService,
  ) {}

  async listPlans() {
    const db = requireDb(this.db);
    const { data, error } = await db.from('subscription_plans').select('*').eq('is_active', true).order('monthly_fee_omr');
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async myPlan(userId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('users').select('plan_id, plan_expires_at, role').eq('user_id', userId).maybeSingle();
    return data ?? null;
  }

  /** Subscribe: charge the monthly fee from the wallet and bind the plan 30d. */
  async subscribe(userId: string, planId: string) {
    const db = requireDb(this.db);
    const { data: plan } = await db.from('subscription_plans').select('*').eq('plan_id', planId).maybeSingle();
    if (!plan) throw new NotFoundException('plan not found');

    const fee = Number(plan.monthly_fee_omr);
    const balance = await this.wallet.getBalance(userId);
    if (balance.balance < fee) {
      throw new BadRequestException(`Top up your wallet first. ${plan.display_name} costs ${fee.toFixed(3)} OMR/mo.`);
    }
    if (fee > 0) {
      await this.wallet.post({ userId, kind: 'PLATFORM_FEE', amount: -fee, note: `${plan.display_name} subscription` });
    }

    const expires = new Date(Date.now() + 30 * 86_400_000).toISOString();
    await db.from('users').update({ plan_id: planId, plan_expires_at: expires }).eq('user_id', userId);

    // Vendors also get a vendor_subscriptions row for feature gating.
    const { data: user } = await db.from('users').select('role').eq('user_id', userId).maybeSingle();
    if (user?.role === 'VENDOR') {
      await db.from('vendor_subscriptions').upsert(
        { vendor_id: userId, plan_id: planId, status: 'ACTIVE', current_period_end: expires },
        { onConflict: 'vendor_id' },
      ).then(() => undefined, () => undefined);
      await db.from('vendor_profiles').update({ subscription_status: 'ACTIVE' }).eq('vendor_id', userId);
    }
    return { planId, until: expires, charged: fee };
  }
}
