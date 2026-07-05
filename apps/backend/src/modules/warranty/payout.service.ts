import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * The Rolling Warranty Payout (master_specs Fix 1) -the single real escrow
 * schedule, replacing the two contradictory promises (full 30-day lock vs.
 * instant milestones) found in the audit. On a job worth `total`:
 *   60% -> vendor, the moment Triple-Verify completion clears
 *   10% -> vendor, at the warranty halfway mark (no open claim)
 *   10% -> vendor, at warranty clearance (no claim the entire period)
 *   20% -> FixIt Now, held the whole window, released alongside the final 10%
 * If the vendor ghosts a valid claim, whatever is still locked is forfeited
 * to fund a replacement vendor and the account takes a strike.
 */
@Injectable()
export class PayoutService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
  ) { }

  private split(total: number) {
    const platformCut = round3(total * 0.2);
    const vendorImmediate = round3(total * 0.6);
    const vendorHalfway = round3(total * 0.1);
    const vendorFinal = round3(total - platformCut - vendorImmediate - vendorHalfway);
    return { platformCut, vendorImmediate, vendorHalfway, vendorFinal };
  }

  /** Called once warranty terms bind. Pays the 60% immediate slice right away. */
  async createSchedule(jobId: string) {
    const db = requireDb(this.db);

    const existing = await db.from('warranty_payout_schedules').select('schedule_id').eq('job_id', jobId).maybeSingle();
    if (existing.data) return existing.data;

    const { data: bid } = await db
      .from('bids')
      .select('bid_id, vendor_id, bid_amount')
      .eq('job_id', jobId)
      .eq('status', 'SELECTED')
      .maybeSingle();
    if (!bid) throw new NotFoundException('no selected bid for this job');

    const split = this.split(Number(bid.bid_amount));
    const now = new Date().toISOString();

    const { data, error } = await db
      .from('warranty_payout_schedules')
      .insert({
        job_id: jobId,
        bid_id: bid.bid_id,
        vendor_id: bid.vendor_id,
        total_amount: bid.bid_amount,
        platform_cut_amount: split.platformCut,
        vendor_immediate_amount: split.vendorImmediate,
        vendor_halfway_amount: split.vendorHalfway,
        vendor_final_amount: split.vendorFinal,
        immediate_released_at: now,
        status: 'ACTIVE',
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    this.realtime.emitWarrantyUpdate(jobId, { event: 'IMMEDIATE_RELEASED', schedule: data });
    return data;
  }

  /** Cron/admin: release the halfway slice for schedules past their warranty midpoint with no open claim. */
  async releaseHalfway(jobId: string) {
    const db = requireDb(this.db);
    const sched = await this.requireActiveSchedule(jobId);
    if (sched.halfway_released_at) return sched;

    const { data, error } = await db
      .from('warranty_payout_schedules')
      .update({ halfway_released_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitWarrantyUpdate(jobId, { event: 'HALFWAY_RELEASED', schedule: data });
    return data;
  }

  /** Cron/admin: release the final slice + platform cut once the warranty clears clean. */
  async releaseFinal(jobId: string) {
    const db = requireDb(this.db);
    const sched = await this.requireActiveSchedule(jobId);

    const { data, error } = await db
      .from('warranty_payout_schedules')
      .update({ final_released_at: new Date().toISOString(), status: 'CLEARED' })
      .eq('job_id', jobId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitWarrantyUpdate(jobId, { event: 'CLEARED', schedule: data });
    return data;
  }

  /** Vendor ghosted a valid warranty claim: forfeit whatever's still locked + strike. */
  async forfeit(jobId: string, reason: string) {
    const db = requireDb(this.db);
    const sched = await this.requireActiveSchedule(jobId);

    const { data, error } = await db
      .from('warranty_payout_schedules')
      .update({ forfeited_at: new Date().toISOString(), forfeit_reason: reason, status: 'FORFEITED' })
      .eq('job_id', jobId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    await db.from('vendor_strikes').insert({ vendor_id: sched.vendor_id, job_id: jobId, reason });

    this.realtime.emitWarrantyUpdate(jobId, { event: 'FORFEITED', schedule: data });
    return data;
  }

  async get(jobId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('warranty_payout_schedules').select('*').eq('job_id', jobId).maybeSingle();
    return data ?? null;
  }

  private async requireActiveSchedule(jobId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('warranty_payout_schedules').select('*').eq('job_id', jobId).maybeSingle();
    if (!data) throw new NotFoundException('no payout schedule for this job');
    if (data.status !== 'ACTIVE') throw new BadRequestException(`schedule already ${data.status}`);
    return data;
  }
}

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
