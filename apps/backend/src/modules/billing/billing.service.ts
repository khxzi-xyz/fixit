import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { WalletService } from '../wallet/wallet.service';
import { RewardsService } from '../rewards/rewards.service';
import { PaymentMethodsService } from './payment-methods.service';

/**
 * Subscriptions (master_specs Module 09 / v2.0 tiers). Plus for consumers, Pro/
 * Elite for vendors -3 OMR (Plus/Pro), 7 OMR (Elite). The monthly fee is paid
 * from the wallet; the plan binds for 30 days.
 */
@Injectable()
export class BillingService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly wallet: WalletService,
    private readonly rewards: RewardsService,
    private readonly paymentMethods: PaymentMethodsService,
  ) { }

  async listPlans() {
    const plans = [
      // Consumer plans
      { plan_id: 'WEEKLY', display_name: 'Weekly Pass', monthly_fee_omr: 1.0, audience: 'CONSUMER', perks: { durationDays: 7, benefits: ['Zero service fees', 'Unlimited image uploads'] }, is_active: true },
      { plan_id: 'PLUS', display_name: 'Monthly Plus', monthly_fee_omr: 3.0, audience: 'CONSUMER', perks: { durationDays: 30, benefits: ['Zero service fees', 'Priority matching', 'Unlimited image uploads'] }, is_active: true },
      { plan_id: 'YEARLY', display_name: 'Yearly Plus', monthly_fee_omr: 30.0, audience: 'CONSUMER', perks: { durationDays: 365, benefits: ['Zero service fees', 'Priority matching', 'Unlimited image uploads', '2 months free'] }, is_active: true },
      { plan_id: 'ONCE', display_name: 'Lifetime Premium', monthly_fee_omr: 99.0, audience: 'CONSUMER', perks: { durationDays: 36500, benefits: ['Unlimited AI usage', 'Golden verified badge', 'Priority support', 'Warranty coverage from FixIt Now', 'Unlimited image uploads'] }, is_active: true },
      // Vendor plans
      { plan_id: 'PRO_MONTHLY', display_name: 'Pro Monthly', monthly_fee_omr: 3.0, audience: 'VENDOR', perks: { durationDays: 30, benefits: ['Priority job feed placement', 'Verified Pro badge', 'Advanced analytics', 'Unlimited bid tokens'] }, is_active: true },
      { plan_id: 'PRO_YEARLY', display_name: 'Pro Yearly', monthly_fee_omr: 30.0, audience: 'VENDOR', perks: { durationDays: 365, benefits: ['Priority job feed placement', 'Verified Pro badge', 'Advanced analytics', 'Unlimited bid tokens', '2 months free'] }, is_active: true },
      { plan_id: 'ELITE_MONTHLY', display_name: 'Elite Monthly', monthly_fee_omr: 7.0, audience: 'VENDOR', perks: { durationDays: 30, benefits: ['Top of feed always', 'Elite gold badge', 'Dedicated support', 'Unlimited bid tokens', 'Revenue analytics', 'Featured on homepage'] }, is_active: true },
      { plan_id: 'ELITE_YEARLY', display_name: 'Elite Yearly', monthly_fee_omr: 70.0, audience: 'VENDOR', perks: { durationDays: 365, benefits: ['Top of feed always', 'Elite gold badge', 'Dedicated support', 'Unlimited bid tokens', 'Revenue analytics', 'Featured on homepage', '2 months free'] }, is_active: true },
      { plan_id: 'ELITE_ONCE', display_name: 'Elite Lifetime', monthly_fee_omr: 199.0, audience: 'VENDOR', perks: { durationDays: 36500, benefits: ['Everything in Elite', 'Never pay again', 'Founding member status', 'Custom profile banner'] }, is_active: true }
    ];
    return plans;
  }

  async myPlan(userId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('users').select('plan_id, plan_expires_at, role, is_lifetime, pro_expires_at').eq('user_id', userId).maybeSingle();
    return data ?? null;
  }

  /** Subscribe: charge the monthly fee from the wallet and bind the plan 30d. */
  async subscribe(userId: string, planId: string) {
    const db = requireDb(this.db);
    const allPlans = await this.listPlans();
    const plan = allPlans.find(p => p.plan_id === planId);
    if (!plan) throw new NotFoundException('plan not found');

    const fee = Number(plan.monthly_fee_omr);
    const balance = await this.wallet.getBalance(userId);
    if (balance.balance < fee) {
      throw new BadRequestException(`Top up your wallet first. ${plan.display_name} costs ${fee.toFixed(3)} OMR/mo.`);
    }
    if (fee > 0) {
      await this.wallet.post({ userId, kind: 'PLATFORM_FEE', amount: -fee, note: `${plan.display_name} subscription` });
    }

    const durationDays = Number(plan.perks?.durationDays) || 30;
    const isLifetime = durationDays > 3650; // Anything > 10 years is lifetime

    // Fetch existing plan to handle stacking and lifetime constraints
    const { data: existingUser } = await db.from('users').select('plan_id, plan_expires_at').eq('user_id', userId).maybeSingle();
    let currentExpires = existingUser?.plan_expires_at ? new Date(existingUser.plan_expires_at) : new Date(0);
    const now = new Date();

    // Stacking: If already have a lifetime plan, cannot buy anything anymore
    if (existingUser?.plan_id) {
      const { data: existingPlan } = await db.from('subscription_plans').select('perks').eq('plan_id', existingUser.plan_id).maybeSingle();
      const existingDurationDays = Number(existingPlan?.perks?.durationDays) || 30;
      if (existingDurationDays > 3650) {
        throw new BadRequestException("You already have a Lifetime plan, you cannot purchase another plan.");
      }
    }

    // Free trial calculation: first time buying gets +3 days
    // First time = they never had a plan before (plan_id is null)
    const isFirstTime = !existingUser?.plan_id;
    let extraDays = isFirstTime ? 3 : 0;

    // Stack days on top of current expires if it's in the future, otherwise from now
    let baseDate = currentExpires > now ? currentExpires : now;
    const expires = new Date(baseDate.getTime() + (durationDays + extraDays) * 86_400_000).toISOString();

    await db.from('users').update({ plan_id: planId, plan_expires_at: expires, is_lifetime: isLifetime, pro_expires_at: expires }).eq('user_id', userId);

    // Vendors also get a vendor_subscriptions row for feature gating.
    const { data: user } = await db.from('users').select('role').eq('user_id', userId).maybeSingle();
    if (user?.role === 'VENDOR') {
      await db.from('vendor_subscriptions').upsert(
        { vendor_id: userId, plan_id: planId, status: 'ACTIVE', current_period_end: expires },
        { onConflict: 'vendor_id' },
      ).then(() => undefined, () => undefined);
      await db.from('vendor_profiles').update({ subscription_status: 'ACTIVE' }).eq('vendor_id', userId);
    }

    // Referral payout: if this user signed up via an invite, reward both sides.
    await this.rewards.onPlanPurchased(userId).catch(() => undefined);

    return { planId, until: expires, charged: fee };
  }

  /**
   * Invited 3-day free trial: requires a saved card (Temu-style "start trial,
   * card on file") and no prior plan. Optionally records the referral code the
   * user arrived with, so the referrer gets credited when they later subscribe.
   */
  async startTrial(userId: string, refCode?: string) {
    const db = requireDb(this.db);
    if (!(await this.paymentMethods.hasAny(userId))) {
      throw new BadRequestException('Add a payment method first to start your free trial.');
    }
    const { data: user } = await db.from('users').select('plan_id, plan_expires_at').eq('user_id', userId).maybeSingle();
    const active = user?.plan_expires_at && new Date(user.plan_expires_at).getTime() > Date.now();
    if (user?.plan_id && active) throw new BadRequestException('You already have an active plan.');
    if (user?.plan_id) throw new BadRequestException('Free trial is for new members only.');

    if (refCode) {
      await this.rewards.claimReferral(userId, refCode).catch(() => undefined);
    }

    const expires = new Date(Date.now() + 3 * 86_400_000).toISOString();
    await db.from('users').update({ plan_id: 'PLUS', plan_expires_at: expires, pro_expires_at: expires }).eq('user_id', userId);
    return { planId: 'PLUS', until: expires, charged: 0, trial: true };
  }
}
