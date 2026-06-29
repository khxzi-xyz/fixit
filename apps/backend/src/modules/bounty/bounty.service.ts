import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const DAILY_FREE_TOKENS = 5;

/**
 * Bidding-engine extras (master_specs Module 03):
 *  - Bounty Bargain (Path B): consumer names a fixed price; vendors accept or
 *    counter via structured in-app offers (never open chat).
 *  - Single-job "Busy" lock: an accepted vendor is blocked from other jobs
 *    unless their shop has multiple staff.
 *  - Bid-Back Tokens: free vendors get a daily allotment; a token refunds on
 *    fair rejection, consumed only on win or ghost.
 */
@Injectable()
export class BountyService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
  ) {}

  // --- Bid-Back Tokens ------------------------------------------------------

  /** Returns the vendor's current token count, refilling the daily grant if the
   *  reset window has passed. Pro/Elite vendors are unlimited (returns Infinity-ish). */
  async ensureTokens(vendorId: string): Promise<number> {
    const db = requireDb(this.db);
    const { data: vp } = await db
      .from('vendor_profiles')
      .select('vendor_id, bid_tokens, bid_tokens_reset_at, subscription_status')
      .eq('vendor_id', vendorId)
      .maybeSingle();
    if (!vp) throw new NotFoundException('vendor profile not found');

    const now = new Date();
    const resetAt = vp.bid_tokens_reset_at ? new Date(vp.bid_tokens_reset_at) : null;
    if (!resetAt || now.getTime() - resetAt.getTime() > 86_400_000) {
      const next = new Date(now.getTime() + 86_400_000).toISOString();
      await db
        .from('vendor_profiles')
        .update({ bid_tokens: DAILY_FREE_TOKENS, bid_tokens_reset_at: next })
        .eq('vendor_id', vendorId);
      await db.from('bid_token_ledger').insert({ vendor_id: vendorId, delta: DAILY_FREE_TOKENS, reason: 'DAILY_GRANT' });
      return DAILY_FREE_TOKENS;
    }
    return Number(vp.bid_tokens);
  }

  async consumeToken(vendorId: string, bidId?: string) {
    const db = requireDb(this.db);
    const current = await this.ensureTokens(vendorId);
    if (current <= 0) throw new ForbiddenException('no bid tokens left today — upgrade to Pro for unlimited bids');
    await db.from('vendor_profiles').update({ bid_tokens: current - 1 }).eq('vendor_id', vendorId);
    await db.from('bid_token_ledger').insert({ vendor_id: vendorId, bid_id: bidId ?? null, delta: -1, reason: 'BID_PLACED' });
    return current - 1;
  }

  /** Refund a token when a bid is fairly rejected (not won, not ghosted). */
  async refundToken(vendorId: string, bidId?: string) {
    const db = requireDb(this.db);
    const { data: vp } = await db.from('vendor_profiles').select('bid_tokens').eq('vendor_id', vendorId).maybeSingle();
    const next = (vp?.bid_tokens ?? 0) + 1;
    await db.from('vendor_profiles').update({ bid_tokens: next }).eq('vendor_id', vendorId);
    await db.from('bid_token_ledger').insert({ vendor_id: vendorId, bid_id: bidId ?? null, delta: 1, reason: 'BID_REFUNDED' });
    return next;
  }

  // --- Busy lock ------------------------------------------------------------

  async assertNotBusy(vendorId: string) {
    const db = requireDb(this.db);
    const { data: vp } = await db
      .from('vendor_profiles')
      .select('is_busy, staff_count')
      .eq('vendor_id', vendorId)
      .maybeSingle();
    if (vp?.is_busy && (vp.staff_count ?? 1) <= 1) {
      throw new ForbiddenException('you are currently Busy on another job');
    }
  }

  async setBusy(vendorId: string, jobId: string | null) {
    const db = requireDb(this.db);
    await db
      .from('vendor_profiles')
      .update({ is_busy: jobId != null, busy_job_id: jobId })
      .eq('vendor_id', vendorId);
  }

  // --- Bounty Bargain (Path B) ----------------------------------------------

  /** Vendor accepts or counters a bounty job's fixed price. */
  async makeOffer(vendorId: string, jobId: string, move: 'ACCEPT' | 'COUNTER', price?: number) {
    const db = requireDb(this.db);
    const { data: job } = await db
      .from('jobs')
      .select('job_id, posting_kind, bounty_price, status, consumer_id')
      .eq('job_id', jobId)
      .maybeSingle();
    if (!job) throw new NotFoundException('job not found');
    if (job.posting_kind !== 'BOUNTY') throw new BadRequestException('not a bounty job');
    if (job.status !== 'OPEN') throw new BadRequestException('bounty no longer open');
    await this.assertNotBusy(vendorId);

    const offerPrice = move === 'ACCEPT' ? Number(job.bounty_price) : Number(price);
    if (move === 'COUNTER' && !price) throw new BadRequestException('counter requires a price');

    const { data, error } = await db
      .from('bounty_offers')
      .insert({ job_id: jobId, vendor_id: vendorId, price: offerPrice, move })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    // First vendor to accept the asking price wins instantly (Module 03 Path B).
    if (move === 'ACCEPT') {
      return this.lockBounty(jobId, data.offer_id, vendorId, offerPrice, job.consumer_id);
    }
    this.realtime.emitBountyUpdate(jobId, { event: 'COUNTER', offer: data });
    this.realtime.emitNotification(job.consumer_id, { kind: 'BOUNTY_COUNTER', jobId, offer: data });
    return data;
  }

  /** Consumer accepts a vendor's counter-offer → lock the job to that vendor. */
  async acceptCounter(consumerId: string, jobId: string, offerId: string) {
    const db = requireDb(this.db);
    const { data: job } = await db.from('jobs').select('consumer_id, status, posting_kind').eq('job_id', jobId).maybeSingle();
    if (!job) throw new NotFoundException('job not found');
    if (job.consumer_id !== consumerId) throw new ForbiddenException('not your job');
    const { data: offer } = await db.from('bounty_offers').select('*').eq('offer_id', offerId).maybeSingle();
    if (!offer || offer.job_id !== jobId) throw new NotFoundException('offer not found');
    return this.lockBounty(jobId, offerId, offer.vendor_id, Number(offer.price), consumerId);
  }

  /** Shared win path: materialize a SELECTED bid + mark vendor Busy. */
  private async lockBounty(jobId: string, offerId: string, vendorId: string, price: number, consumerId: string) {
    const db = requireDb(this.db);
    // Create a synthetic SELECTED bid so the rest of the pipeline (escrow,
    // milestones, warranty payout) works identically to standard jobs.
    const { data: bid, error: bidErr } = await db
      .from('bids')
      .insert({
        job_id: jobId,
        vendor_id: vendorId,
        bid_amount: price,
        proposed_milestones: [{ label: 'Completion', pct: 100 }],
        status: 'SELECTED',
      })
      .select('*')
      .single();
    if (bidErr) throw new BadRequestException(bidErr.message);

    await db.from('bounty_offers').update({ status: 'ACCEPTED' }).eq('offer_id', offerId);
    await db.from('bounty_offers').update({ status: 'REJECTED' }).eq('job_id', jobId).neq('offer_id', offerId);
    await db.from('jobs').update({ status: 'BID_SELECTED' }).eq('job_id', jobId);
    await this.setBusy(vendorId, jobId);

    this.realtime.emitBountyUpdate(jobId, { event: 'LOCKED', vendorId, price, bidId: bid.bid_id });
    this.realtime.emitNotification(vendorId, { kind: 'BOUNTY_WON', jobId, price });
    return { jobId, vendorId, price, bidId: bid.bid_id, status: 'BID_SELECTED' };
  }

  async listOffers(jobId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('bounty_offers')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }
}
