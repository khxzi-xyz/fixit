import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { WalletService } from '../wallet/wallet.service';
import { tableMissing } from './rewards.service';

const MIGRATION_HINT = 'Coupon tables are missing — apply db/migrations/0017 in the Supabase SQL editor.';

export interface CreateCouponInput {
  code?: string;
  kind: 'CREDIT' | 'PLAN_DAYS';
  amountOmr?: number;
  planId?: string;
  days?: number;
  maxUses?: number | null;   // null/undefined = unlimited
  expiresAt?: string | null; // null = never
  audience?: 'ALL' | 'CONSUMER' | 'VENDOR';
  isPublic?: boolean;
  note?: string;
}

/**
 * Admin-made coupons: either an instant wallet credit (e.g. gift a friend
 * 39 OMR) or gifted plan days (e.g. 23 days of Pro). Redeemable once per user,
 * with an optional global use cap and optional expiry ("never" = NULL).
 */
@Injectable()
export class CouponsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly wallet: WalletService,
  ) {}

  private genCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return `FIXIT-${s}`;
  }

  async create(adminId: string, input: CreateCouponInput) {
    const db = requireDb(this.db);
    if (input.kind === 'CREDIT' && !(Number(input.amountOmr) > 0)) {
      throw new BadRequestException('CREDIT coupons need amountOmr > 0');
    }
    if (input.kind === 'PLAN_DAYS' && !(Number(input.days) > 0)) {
      throw new BadRequestException('PLAN_DAYS coupons need days > 0');
    }
    const code = (input.code?.trim().toUpperCase() || this.genCode()).slice(0, 40);
    const { data, error } = await db
      .from('coupons')
      .insert({
        code,
        kind: input.kind,
        amount_omr: input.kind === 'CREDIT' ? Number(input.amountOmr) : null,
        plan_id: input.kind === 'PLAN_DAYS' ? (input.planId ?? 'PLUS') : null,
        days: input.kind === 'PLAN_DAYS' ? Number(input.days) : null,
        max_uses: input.maxUses ?? null,
        audience: input.audience ?? 'ALL',
        is_public: input.isPublic ?? false,
        expires_at: input.expiresAt ?? null,
        note: input.note ?? null,
        created_by: adminId,
      })
      .select('*')
      .single();
    if (error) {
      if (tableMissing(error)) throw new BadRequestException(MIGRATION_HINT);
      if (/duplicate|unique/i.test(error.message)) throw new BadRequestException(`Code ${code} already exists`);
      throw new BadRequestException(error.message);
    }
    return data;
  }

  async listAll() {
    const db = requireDb(this.db);
    const { data, error } = await db.from('coupons').select('*').order('created_at', { ascending: false });
    if (error) {
      if (tableMissing(error)) return [];
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }

  async remove(couponId: string) {
    const db = requireDb(this.db);
    const { error } = await db.from('coupons').delete().eq('coupon_id', couponId);
    if (error && !tableMissing(error)) throw new BadRequestException(error.message);
    return { deleted: true };
  }

  /** Public promo coupons for the Rewards page (gift codes stay private). */
  async listPublic() {
    if (!this.db) return [];
    const { data, error } = await this.db
      .from('coupons')
      .select('coupon_id, code, kind, amount_omr, plan_id, days, expires_at, note')
      .eq('is_public', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error || !data) return [];
    const now = Date.now();
    return data.filter((c) => !c.expires_at || new Date(c.expires_at).getTime() > now);
  }

  async redeem(userId: string, role: string, rawCode: string) {
    const db = requireDb(this.db);
    const code = rawCode.trim().toUpperCase();
    
    let coupon: any;
    try {
      const { data, error } = await db.from('coupons').select('*').eq('code', code).maybeSingle();
      if (error) {
        if (tableMissing(error)) throw new BadRequestException(MIGRATION_HINT);
        throw new BadRequestException(`Coupon lookup failed: ${error.message}`);
      }
      coupon = data;
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(`Coupon system unavailable: ${(e as Error).message}`);
    }
    
    if (!coupon || !coupon.is_active) throw new NotFoundException('Invalid coupon code');
    if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now()) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.max_uses != null && coupon.use_count >= coupon.max_uses) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }
    if (coupon.audience !== 'ALL' && coupon.audience !== role) {
      throw new BadRequestException(`This coupon is only for ${coupon.audience.toLowerCase()} accounts`);
    }

    const { error: redErr } = await db
      .from('coupon_redemptions')
      .insert({ coupon_id: coupon.coupon_id, user_id: userId });
    if (redErr) {
      if (/duplicate|unique/i.test(redErr.message)) throw new BadRequestException('You already used this coupon');
      if (tableMissing(redErr)) throw new BadRequestException(MIGRATION_HINT);
      throw new BadRequestException(`Redemption failed: ${redErr.message}`);
    }
    await db.from('coupons').update({ use_count: coupon.use_count + 1 }).eq('coupon_id', coupon.coupon_id);

    if (coupon.kind === 'CREDIT') {
      const amount = Number(coupon.amount_omr);
      const res = await this.wallet.post({ userId, kind: 'VOUCHER_CREDIT', amount, note: `Coupon ${code}` });
      return { kind: 'CREDIT', credited: amount, walletBalance: res?.balance ?? null, message: `${amount.toFixed(3)} OMR added to your wallet!` };
    }

    // PLAN_DAYS: stack the gifted days on the user's plan (same rule as billing.subscribe)
    const days = Number(coupon.days);
    const { data: user } = await db.from('users').select('plan_id, plan_expires_at, is_lifetime').eq('user_id', userId).maybeSingle();
    if (user?.is_lifetime) throw new BadRequestException('You already have a Lifetime plan');
    const now = new Date();
    const current = user?.plan_expires_at ? new Date(user.plan_expires_at) : now;
    const base = current > now ? current : now;
    const expires = new Date(base.getTime() + days * 86_400_000).toISOString();
    const planId = coupon.plan_id ?? user?.plan_id ?? 'PLUS';
    await db.from('users').update({ plan_id: planId, plan_expires_at: expires, pro_expires_at: expires }).eq('user_id', userId);
    return { kind: 'PLAN_DAYS', days, planId, until: expires, message: `${days} days of ${planId} added to your account!` };
  }

  /** Admin view of the referral pipeline. */
  async listReferrals() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) {
      if (tableMissing(error)) return [];
      throw new BadRequestException(error.message);
    }
    return data ?? [];
  }
}
