import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { WalletService } from '../wallet/wallet.service';

/**
 * Voucher economy (master_specs Module 21). One FixIt Now-XXXX code system for
 * wallet credit, time-based plan unlocks, and fee discounts.
 */
@Injectable()
export class VoucherService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly wallet: WalletService,
  ) { }

  async redeem(userId: string, code: string) {
    const db = requireDb(this.db);
    const norm = code.trim().toUpperCase();
    const { data: v } = await db.from('vouchers').select('*').eq('code', norm).maybeSingle();
    if (!v) throw new NotFoundException('voucher not found');
    if (v.expires_at && new Date(v.expires_at) < new Date()) throw new BadRequestException('voucher expired');
    if (v.redemption_count >= v.max_redemptions) throw new BadRequestException('voucher fully redeemed');

    const { data: already } = await db
      .from('voucher_redemptions')
      .select('redemption_id')
      .eq('voucher_id', v.voucher_id)
      .eq('user_id', userId)
      .maybeSingle();
    if (already) throw new ForbiddenException('you already redeemed this voucher');

    let result: Record<string, unknown> = { kind: v.kind };
    if (v.kind === 'WALLET_CREDIT' && v.amount) {
      await this.wallet.post({ userId, kind: 'VOUCHER_CREDIT', amount: Number(v.amount), note: `voucher ${norm}` });
      result.credited = Number(v.amount);
    } else if (v.kind === 'PLAN_UNLOCK' && v.plan_code) {
      const expires = new Date(Date.now() + (v.plan_days ?? 30) * 86_400_000).toISOString();
      await db.from('users').update({ plan_id: v.plan_code, plan_expires_at: expires }).eq('user_id', userId);
      result.plan = v.plan_code;
      result.until = expires;
    } else if (v.kind === 'FEE_DISCOUNT') {
      result.feeDiscountPct = Number(v.fee_discount_pct);
    }

    await db.from('voucher_redemptions').insert({ voucher_id: v.voucher_id, user_id: userId });
    await db.from('vouchers').update({ redemption_count: v.redemption_count + 1 }).eq('voucher_id', v.voucher_id);
    return result;
  }
}
