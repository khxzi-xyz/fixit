import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { WalletService } from '../wallet/wallet.service';

/** Base URL used in shareable referral links (the consumer web app). */
const APP_URL = process.env.PUBLIC_APP_URL || 'https://fixit-now.xyz';

/** True when the error is "relation does not exist" (migration 0017 not applied). */
export function tableMissing(e: any): boolean {
  const m = `${e?.code ?? ''} ${e?.message ?? ''}`;
  return m.includes('42P01') || m.includes('PGRST205') || /does not exist|schema cache/i.test(m);
}

const MIGRATION_HINT = 'Rewards ledger tables are missing — apply db/migrations/0017 in the Supabase SQL editor.';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly wallet: WalletService,
  ) {}

  private mockRow(userId: string) {
    return { reward_id: 'rw-dev', user_id: userId, balance: 0, lifetime_earned: 0, points: 0, tier: 'BRONZE', cashbackRate: 0.02, _mock: true };
  }

  private tierFor(lifetime: number) {
    return lifetime >= 20 ? 'GOLD' : lifetime >= 5 ? 'SILVER' : 'BRONZE';
  }

  private async generateCustomReferralCode(userId: string): Promise<string> {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
    
    let prefix = 'FIXIT';
    if (this.db) {
      try {
        const { data: user } = await this.db.from('users').select('full_name, email').eq('user_id', userId).maybeSingle();
        if (user?.full_name?.trim()) {
          prefix = user.full_name.trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
        } else if (user?.email) {
          prefix = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
        }
      } catch (e) {
        // Fallback to default prefix
      }
    }
    return `${prefix || 'USER'}-${rand}`;
  }

  private referralCodeFor(userId: string): string {
    return `FIXIT-${userId.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  }

  /** Fetch-or-create the user's rewards row. Returns null when 0017 isn't applied. */
  private async ensureRow(userId: string) {
    if (!this.db) return null;
    const { data, error } = await this.db.from('user_rewards').select('*').eq('user_id', userId).maybeSingle();
    if (error) {
      if (tableMissing(error)) return null;
      throw new BadRequestException(error.message);
    }
    if (data) return data;
    const refCode = await this.generateCustomReferralCode(userId);
    const { data: created, error: insErr } = await this.db
      .from('user_rewards')
      .insert({ user_id: userId, balance: 0, lifetime_earned: 0, points: 0, referral_code: refCode })
      .select('*')
      .single();
    if (insErr) {
      if (tableMissing(insErr)) return null;
      // race: another request created it
      const { data: again } = await this.db.from('user_rewards').select('*').eq('user_id', userId).maybeSingle();
      if (again) return again;
      throw new BadRequestException(insErr.message);
    }
    return created;
  }

  async getRewardsMe(userId: string) {
    const row = await this.ensureRow(userId);
    if (!row) return this.mockRow(userId);
    return {
      reward_id: row.reward_id,
      user_id: userId,
      balance: Number(row.balance),
      lifetime_earned: Number(row.lifetime_earned),
      points: row.points,
      tier: this.tierFor(Number(row.lifetime_earned)),
      cashbackRate: 0.02,
    };
  }

  async getTransactions(userId: string) {
    if (!this.db) return [];
    const { data, error } = await this.db
      .from('reward_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) return [];
    return data ?? [];
  }

  /** Credit the rewards balance (cashback, referral, bonus) and log it. */
  async addReward(userId: string, amount: number, kind: 'CASHBACK' | 'REFERRAL' | 'BONUS', note?: string) {
    const row = await this.ensureRow(userId);
    if (!row || !this.db) return null;
    const { error } = await this.db
      .from('user_rewards')
      .update({
        balance: Number(row.balance) + amount,
        lifetime_earned: Number(row.lifetime_earned) + amount,
        points: (row.points ?? 0) + Math.round(amount * 100),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    if (error) return null;
    await this.db.from('reward_transactions').insert({ user_id: userId, kind, amount, note: note ?? null });
    return { credited: amount };
  }

  /** Move rewards balance into the spendable wallet. */
  async redeem(userId: string, amount?: number) {
    const row = await this.ensureRow(userId);
    if (!row || !this.db) throw new BadRequestException(MIGRATION_HINT);
    const balance = Number(row.balance);
    const take = Math.min(amount && amount > 0 ? amount : balance, balance);
    if (take < 0.1) throw new BadRequestException('Minimum redemption is 0.100 OMR.');

    const { error } = await this.db
      .from('user_rewards')
      .update({ balance: balance - take, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('balance', row.balance); // optimistic lock against double-redeem
    if (error) throw new BadRequestException(error.message);

    await this.db.from('reward_transactions').insert({ user_id: userId, kind: 'REDEEMED', amount: -take, note: 'Redeemed to wallet' });
    const res = await this.wallet.post({ userId, kind: 'VOUCHER_CREDIT', amount: take, note: 'Rewards redeemed to wallet' });
    return { redeemed: take, walletBalance: res?.balance ?? null };
  }

  async getReferralCode(userId: string) {
    const row = await this.ensureRow(userId);
    let code = row?.referral_code;
    if (row && !code && this.db) {
      code = await this.generateCustomReferralCode(userId);
      await this.db.from('user_rewards').update({ referral_code: code }).eq('user_id', userId);
    }
    if (!code) code = await this.generateCustomReferralCode(userId);
    return { code, referral_url: `${APP_URL}/invite/${code}` };
  }

  /** Record that `userId` signed up via `code`. Idempotent; self-referrals rejected. */
  async claimReferral(userId: string, code: string) {
    if (!this.db) throw new BadRequestException('Database unavailable');
    const clean = code.trim().toUpperCase();
    const { data: referrer, error } = await this.db
      .from('user_rewards')
      .select('user_id')
      .eq('referral_code', clean)
      .maybeSingle();
    if (error && tableMissing(error)) throw new BadRequestException(MIGRATION_HINT);
    if (!referrer) throw new BadRequestException('Invalid referral code');
    if (referrer.user_id === userId) throw new BadRequestException("You can't refer yourself");

    const { error: insErr } = await this.db
      .from('referrals')
      .insert({ referrer_id: referrer.user_id, referred_id: userId, code: clean });
    if (insErr) {
      if (tableMissing(insErr)) throw new BadRequestException(MIGRATION_HINT);
      // unique(referred_id) → already claimed; treat as success
      return { claimed: true, already: true };
    }
    return { claimed: true };
  }

  /** Called after a plan purchase: pay out the pending referral to both sides. */
  async onPlanPurchased(userId: string) {
    if (!this.db) return;
    try {
      const { data: ref } = await this.db
        .from('referrals')
        .select('*')
        .eq('referred_id', userId)
        .eq('status', 'PENDING')
        .maybeSingle();
      if (!ref) return;
      await this.db
        .from('referrals')
        .update({ status: 'REWARDED', rewarded_at: new Date().toISOString() })
        .eq('referral_id', ref.referral_id);
      await this.addReward(ref.referrer_id, 1.0, 'REFERRAL', 'Referral bonus — your friend subscribed');
      await this.addReward(userId, 1.0, 'REFERRAL', 'Referral bonus — welcome to Plus');
    } catch (e) {
      this.logger.warn(`referral payout skipped: ${e}`);
    }
  }

  async getReferralStats(userId: string) {
    if (!this.db) return { total_referred: 0, pending: 0, rewarded: 0 };
    const { data, error } = await this.db.from('referrals').select('status').eq('referrer_id', userId);
    if (error || !data) return { total_referred: 0, pending: 0, rewarded: 0 };
    return {
      total_referred: data.length,
      pending: data.filter((r) => r.status === 'PENDING').length,
      rewarded: data.filter((r) => r.status === 'REWARDED').length,
    };
  }
}
