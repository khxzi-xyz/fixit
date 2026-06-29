import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { EscrowService } from '../escrow/escrow.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { AiService } from '../ai/ai.service';
import { BountyService } from '../bounty/bounty.service';
import { WalletService } from '../wallet/wallet.service';

interface Milestone {
  label: string;
  pct: number;
}
export interface SubmitBidInput {
  jobId: string;
  bidAmount: number; // OMR (e.g. 150.000)
  proposedMilestones: Milestone[];
  estimatedStartAt?: string;
}

const OMR_MINOR = 1000;

@Injectable()
export class BidsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly escrow: EscrowService,
    private readonly realtime: RealtimeGateway,
    private readonly ai: AiService,
    private readonly bounty: BountyService,
    private readonly wallet: WalletService,
  ) {}

  async submit(vendorId: string, input: SubmitBidInput) {
    const db = requireDb(this.db);

    const { data: vendor } = await db
      .from('vendor_profiles')
      .select('verification_status')
      .eq('vendor_id', vendorId)
      .maybeSingle();
    if (!vendor || vendor.verification_status !== 'VERIFIED') {
      throw new ForbiddenException('only VERIFIED vendors can bid');
    }

    // Single-job Busy lock (Module 03/08): a busy vendor can't take more jobs.
    await this.bounty.assertNotBusy(vendorId);

    const { data: job } = await db.from('jobs').select('status').eq('job_id', input.jobId).maybeSingle();
    if (!job) throw new NotFoundException('job not found');
    if (job.status !== 'OPEN') throw new BadRequestException('job is not open for bids');

    const pctSum = input.proposedMilestones.reduce((s, m) => s + m.pct, 0);
    if (Math.round(pctSum) !== 100) throw new BadRequestException('milestone percentages must sum to 100');

    // Bid-floor guard (Module 01/03): block clear market-sabotage lowballs.
    const floor = await this.ai.checkBidFloor(input.jobId, input.bidAmount);
    if (floor.block) {
      throw new BadRequestException(floor.reason ?? 'bid is below the protected market floor');
    }

    // Consume a Bid-Back token (free tier). Pro/Elite handled inside ensureTokens.
    await this.bounty.consumeToken(vendorId);

    const insert = await db
      .from('bids')
      .insert({
        job_id: input.jobId,
        vendor_id: vendorId,
        bid_amount: input.bidAmount,
        proposed_milestones: input.proposedMilestones,
        estimated_start_at: input.estimatedStartAt ?? null,
        below_floor: floor.belowFloor,
        flagged_reason: floor.belowFloor ? floor.reason ?? null : null,
      })
      .select('*')
      .single();
    if (insert.error) throw new BadRequestException(insert.error.message);

    this.realtime.emitBidArrival(input.jobId, { bidId: insert.data.bid_id, amount: input.bidAmount, belowFloor: floor.belowFloor });
    return insert.data;
  }

  /** Bids visible to the consumer (sealed: competitors' prices not exposed to vendors). */
  async listForJob(jobId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('bids')
      .select('bid_id, vendor_id, bid_amount, proposed_milestones, estimated_start_at, status, created_at')
      .eq('job_id', jobId)
      .order('bid_amount', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /**
   * Consumer selects a winning bid (PRD §2.A.4 → §1.C.1). Funds come from the
   * in-app wallet (Module 04): the full Khidmah is held in escrow instantly, no
   * external redirect. If the wallet can't cover it, the caller is told to top
   * up. On success the job moves to BID_SELECTED, milestones materialize, the
   * vendor flips to Busy, and rejected vendors get their bid tokens back.
   */
  async select(consumerId: string, jobId: string, bidId: string) {
    const db = requireDb(this.db);

    const { data: job } = await db.from('jobs').select('consumer_id, status').eq('job_id', jobId).maybeSingle();
    if (!job) throw new NotFoundException('job not found');
    if (job.consumer_id !== consumerId) throw new ForbiddenException('not your job');
    if (job.status !== 'OPEN' && job.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('this job already has a selected vendor');
    }

    const { data: bid } = await db.from('bids').select('*').eq('bid_id', bidId).maybeSingle();
    if (!bid || bid.job_id !== jobId) throw new NotFoundException('bid not found');

    const amount = Number(bid.bid_amount);

    // Fund escrow from the consumer's wallet. Clear, actionable error if short.
    const balance = await this.wallet.getBalance(consumerId);
    if (balance.balance < amount) {
      throw new BadRequestException(
        `Top up your wallet to accept this bid. Need ${amount.toFixed(3)} OMR, you have ${balance.balance.toFixed(3)} OMR.`,
      );
    }
    await this.wallet.hold({ userId: consumerId, amount, kind: 'JOB_FUND_HOLD', jobId, note: `escrow for job ${jobId.slice(0, 8)}` });

    // Refund Bid-Back tokens to the fairly-rejected vendors (Module 03).
    const { data: losing } = await db
      .from('bids')
      .select('vendor_id, bid_id')
      .eq('job_id', jobId)
      .neq('bid_id', bidId);
    for (const l of losing ?? []) {
      await this.bounty.refundToken(l.vendor_id, l.bid_id).catch(() => undefined);
    }

    await db.from('bids').update({ status: 'REJECTED' }).eq('job_id', jobId).neq('bid_id', bidId);
    await db.from('bids').update({ status: 'SELECTED' }).eq('bid_id', bidId);
    await db.from('jobs').update({ status: 'BID_SELECTED' }).eq('job_id', jobId);

    // Winning vendor flips to Busy (single-job lock, Module 03/08).
    await this.bounty.setBusy(bid.vendor_id, jobId);

    const milestones = (bid.proposed_milestones as { label: string; pct: number }[]).map((m, i) => ({
      job_id: jobId,
      bid_id: bidId,
      milestone_index: i,
      label: m.label,
      pct: m.pct,
      amount: Math.round((amount * m.pct) / 100 * 1000) / 1000,
    }));
    await db.from('job_milestones').insert(milestones);

    // Append an audit ledger row marking funds HOLDING (no external partner).
    await db.from('escrow_ledgers').insert({
      job_id: jobId,
      bid_id: bidId,
      milestone_index: 0,
      state: 'HOLDING',
      amount: Math.round(amount * OMR_MINOR),
      actor_user_id: consumerId,
    }).then(() => undefined, () => undefined);

    this.realtime.emitMilestoneUpdate(jobId, { event: 'ESCROW_FUNDED', amount, vendorId: bid.vendor_id });
    this.realtime.emitNotification(bid.vendor_id, { kind: 'BID_WON', jobId, amount });

    return { bidId, status: 'BID_SELECTED', escrow: { funded: true, amount, source: 'WALLET' } };
  }
}
