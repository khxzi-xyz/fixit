import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { PaypalClient } from './paypal.client';
import { computeRefund, RefundMethod } from './refund-math';

export type EscrowState =
  | 'PENDING_FUNDING'
  | 'HOLDING'
  | 'AUTO_RELEASE_PENDING'
  | 'RELEASED'
  | 'DISPUTED'
  | 'REFUNDED'
  | 'ESCALATED_INSURANCE_CLAIM';

/**
 * Allowed transitions (PRD §1.C.1), amended per ideas.md "Pivot": the platform
 * no longer provides liability insurance, so ESCALATED_INSURANCE_CLAIM is
 * unreachable — disputes resolve only via RELEASED or REFUNDED. The state value
 * remains in the type/DB enum for backward compatibility but is never entered.
 */
const TRANSITIONS: Record<EscrowState, EscrowState[]> = {
  PENDING_FUNDING: ['HOLDING'], // FUNDING_FAILED handled by job returning to OPEN
  HOLDING: ['RELEASED', 'DISPUTED', 'AUTO_RELEASE_PENDING'],
  AUTO_RELEASE_PENDING: ['RELEASED', 'DISPUTED'],
  RELEASED: [],
  DISPUTED: ['RELEASED', 'REFUNDED'],
  REFUNDED: [],
  ESCALATED_INSURANCE_CLAIM: [], // removed per ideas.md pivot
};

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient,
    private readonly paypal: PaypalClient,
  ) {}

  /** Latest ledger row for a (job, milestone) = current state. */
  private async currentState(jobId: string, milestoneIndex: number) {
    const { data, error } = await this.db
      .from('escrow_ledgers')
      .select('*')
      .eq('job_id', jobId)
      .eq('milestone_index', milestoneIndex)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  private assertTransition(from: EscrowState | undefined, to: EscrowState) {
    if (!from) {
      if (to !== 'PENDING_FUNDING') {
        throw new BadRequestException(`first ledger entry must be PENDING_FUNDING, got ${to}`);
      }
      return;
    }
    if (!TRANSITIONS[from].includes(to)) {
      throw new BadRequestException(`illegal escrow transition ${from} -> ${to}`);
    }
  }

  /** Append-only write — never UPDATE/DELETE (PRD §3.A.2). */
  private async appendLedger(row: {
    job_id: string;
    bid_id: string;
    milestone_index: number;
    state: EscrowState;
    amount: number;
    platform_cut_amount?: number;
    vendor_payout_amount?: number;
    actor_user_id?: string;
    external_payment_ref?: string;
    insurance_claim_ref?: string;
  }) {
    const { error } = await this.db.from('escrow_ledgers').insert(row);
    if (error) throw new Error(error.message);
  }

  /** Consumer selected a bid → create order, record PENDING_FUNDING. */
  async initiateFunding(params: {
    jobId: string;
    bidId: string;
    milestoneIndex: number;
    amountMinor: number;
    currency: string;
    actorUserId: string;
  }) {
    const existing = await this.currentState(params.jobId, params.milestoneIndex);
    this.assertTransition(existing?.state as EscrowState | undefined, 'PENDING_FUNDING');

    const order = await this.paypal.createOrder(
      (params.amountMinor / 100).toFixed(2),
      params.currency,
      `${params.jobId}:${params.milestoneIndex}`,
    );

    await this.appendLedger({
      job_id: params.jobId,
      bid_id: params.bidId,
      milestone_index: params.milestoneIndex,
      state: 'PENDING_FUNDING',
      amount: params.amountMinor,
      actor_user_id: params.actorUserId,
      external_payment_ref: order.id,
    });
    return { orderId: order.id, approveLinks: order.links };
  }

  /** Capture an approved order → HOLDING. */
  async confirmFunding(params: {
    jobId: string;
    bidId: string;
    milestoneIndex: number;
    orderId: string;
    amountMinor: number;
    actorUserId: string;
  }) {
    const current = await this.currentState(params.jobId, params.milestoneIndex);
    this.assertTransition(current?.state as EscrowState | undefined, 'HOLDING');

    const capture = await this.paypal.captureOrder(params.orderId);
    await this.appendLedger({
      job_id: params.jobId,
      bid_id: params.bidId,
      milestone_index: params.milestoneIndex,
      state: 'HOLDING',
      amount: params.amountMinor,
      actor_user_id: params.actorUserId,
      external_payment_ref: capture.id ?? params.orderId,
    });
    return { state: 'HOLDING' as const };
  }

  /**
   * Admin/dispute resolution with deterministic, logged refund math (§1.C.2).
   * Produces a REFUNDED (or partial) terminal ledger entry.
   */
  async resolveDispute(params: {
    jobId: string;
    bidId: string;
    milestoneIndex: number;
    commissionRate: number;
    refundFraction: number;
    method: RefundMethod;
    actorUserId: string;
  }) {
    const current = await this.currentState(params.jobId, params.milestoneIndex);
    this.assertTransition(current?.state as EscrowState | undefined, 'REFUNDED');
    if (!current) throw new BadRequestException('no escrow record to resolve');

    const split = computeRefund({
      originalAmountMinor: current.amount,
      commissionRate: params.commissionRate,
      refundFraction: params.refundFraction,
      method: params.method,
    });

    await this.appendLedger({
      job_id: params.jobId,
      bid_id: params.bidId,
      milestone_index: params.milestoneIndex,
      state: 'REFUNDED',
      amount: current.amount,
      platform_cut_amount: split.platformCutMinor,
      vendor_payout_amount: split.vendorPayoutMinor,
      actor_user_id: params.actorUserId,
    });
    // TODO: trigger actual PayPal refund + vendor payout via the licensed
    // payment partner once the production escrow arrangement is in place.
    return split;
  }
}
