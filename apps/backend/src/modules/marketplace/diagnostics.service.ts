import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WalletService } from '../wallet/wallet.service';

/**
 * Workshop Diagnostics -the Rolling Diagnostic Pass (master_specs Module 18).
 * User pays ONE 3 OMR pass. Shops that can't diagnose release it untouched. The
 * shop that solves it gets 1 OMR immediately; the remaining 2 OMR rolls into
 * the repair as a discount.
 */
@Injectable()
export class DiagnosticsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
    private readonly wallet: WalletService,
  ) { }

  /** Buy the rolling pass; 3 OMR locked in escrow. */
  async buyPass(consumerId: string, input: { categoryId?: string; description?: string }) {
    const db = requireDb(this.db);
    await this.wallet.hold({ userId: consumerId, amount: 3, kind: 'DIAGNOSTIC_PASS', note: 'rolling diagnostic pass' });
    const { data, error } = await db
      .from('diagnostic_passes')
      .insert({ consumer_id: consumerId, category_id: input.categoryId ?? null, description: input.description ?? null })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getPass(passId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('diagnostic_passes').select('*').eq('pass_id', passId).maybeSingle();
    if (!data) throw new NotFoundException('pass not found');
    return data;
  }

  async myPasses(consumerId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('diagnostic_passes')
      .select('*')
      .eq('consumer_id', consumerId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  /** Shop logs a visit. "Cannot diagnose" leaves the pass untouched. */
  async logVisit(vendorId: string, passId: string, outcome: 'CANNOT_DIAGNOSE' | 'DIAGNOSED', note?: string) {
    const db = requireDb(this.db);
    const pass = await this.getPass(passId);
    if (pass.status !== 'ACTIVE') throw new BadRequestException(`pass is ${pass.status}`);

    const { data: visit, error } = await db
      .from('diagnostic_visits')
      .insert({ pass_id: passId, vendor_id: vendorId, outcome, note: note ?? null })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    if (outcome === 'DIAGNOSED') {
      // 1 OMR releases to the solving shop now; 2 OMR rolls into the repair.
      await this.wallet.releaseLocked({
        fromUserId: pass.consumer_id,
        amount: Number(pass.resolved_amount),
        toUserId: vendorId,
        kind: 'VENDOR_PAYOUT_EARNED',
        note: 'diagnostic solved (1 OMR)',
      });
      await db
        .from('diagnostic_passes')
        .update({ status: 'DIAGNOSED', diagnosed_by_vendor_id: vendorId, diagnosis_note: note ?? null, diagnosed_at: new Date().toISOString() })
        .eq('pass_id', passId);
      this.realtime.emitNotification(pass.consumer_id, { kind: 'DIAGNOSIS_FOUND', passId, vendorId });
    }
    return visit;
  }

  /**
   * Convert a diagnosed pass into a locked repair job: consumer accepts a shop
   * quote, pays 50% deposit; the 2 OMR rollover discounts the bill.
   */
  async acceptQuote(consumerId: string, passId: string, totalPrice: number) {
    const db = requireDb(this.db);
    const pass = await this.getPass(passId);
    if (pass.consumer_id !== consumerId) throw new ForbiddenException('not your pass');
    if (pass.status !== 'DIAGNOSED') throw new BadRequestException('pass not in DIAGNOSED state');

    const rollover = Number(pass.rollover_amount);
    const net = Math.max(0, totalPrice - rollover);
    const deposit = Math.round((net * 0.5) * 1000) / 1000;

    // Release the rollover from the pass toward the repair; lock the 50% deposit.
    await this.wallet.releaseLocked({ fromUserId: consumerId, amount: rollover, toUserId: pass.diagnosed_by_vendor_id, kind: 'JOB_FUND_RELEASE', note: 'diagnostic rollover applied' });
    await this.wallet.hold({ userId: consumerId, amount: deposit, kind: 'JOB_FUND_HOLD', note: '50% repair deposit' });

    await db.from('diagnostic_passes').update({ status: 'CONVERTED' }).eq('pass_id', passId);
    this.realtime.emitNotification(pass.diagnosed_by_vendor_id, { kind: 'QUOTE_ACCEPTED', passId, deposit });
    return { net, rollover, deposit, remaining: Math.round((net - deposit) * 1000) / 1000 };
  }
}
