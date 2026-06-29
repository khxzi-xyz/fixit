import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { WalletService } from '../wallet/wallet.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/** Disputes & resolution (master_specs §1.A.3 / Module 06). Admin reviews the
 *  before/after photos and either refunds the consumer or releases to the
 *  vendor — moving the real escrow-held wallet funds. */
@Injectable()
export class DisputesService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly wallet: WalletService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async listOpen() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('disputes')
      .select('*')
      .eq('status', 'OPEN')
      .order('sla_due_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async forJob(jobId: string) {
    const db = requireDb(this.db);
    const { data } = await db
      .from('disputes')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  }

  private async parties(jobId: string) {
    const db = requireDb(this.db);
    const { data: job } = await db.from('jobs').select('consumer_id').eq('job_id', jobId).maybeSingle();
    const { data: bid } = await db.from('bids').select('vendor_id, bid_amount').eq('job_id', jobId).eq('status', 'SELECTED').maybeSingle();
    return { consumerId: job?.consumer_id as string, vendorId: bid?.vendor_id as string, amount: Number(bid?.bid_amount ?? 0) };
  }

  /** Admin verdict. REFUND_CONSUMER returns held funds; RELEASE_VENDOR pays out. */
  async resolve(disputeId: string, adminId: string, decision: 'REFUND_CONSUMER' | 'RELEASE_VENDOR', note?: string) {
    const db = requireDb(this.db);
    const { data: dispute } = await db.from('disputes').select('*').eq('dispute_id', disputeId).maybeSingle();
    if (!dispute) throw new NotFoundException('dispute not found');
    if (dispute.status !== 'OPEN') throw new BadRequestException(`already ${dispute.status}`);

    const { consumerId, vendorId, amount } = await this.parties(dispute.job_id);
    if (amount > 0) {
      const to = decision === 'REFUND_CONSUMER' ? consumerId : vendorId;
      await this.wallet.releaseLocked({
        fromUserId: consumerId,
        amount,
        toUserId: to,
        kind: decision === 'REFUND_CONSUMER' ? 'REFUND' : 'VENDOR_PAYOUT_EARNED',
        jobId: dispute.job_id,
        note: `dispute ${decision.toLowerCase()}`,
      });
    }

    await db.from('disputes').update({
      status: 'RESOLVED',
      resolution_method: decision === 'REFUND_CONSUMER' ? 'METHOD_1' : 'METHOD_2',
      resolved_by_admin_id: adminId,
      resolved_at: new Date().toISOString(),
    }).eq('dispute_id', disputeId);

    await db.from('jobs').update({ status: decision === 'REFUND_CONSUMER' ? 'CANCELLED' : 'COMPLETED' }).eq('job_id', dispute.job_id);
    if (vendorId) await db.from('vendor_profiles').update({ is_busy: false, busy_job_id: null }).eq('vendor_id', vendorId).then(() => undefined, () => undefined);

    this.realtime.emitNotification(consumerId, { kind: 'DISPUTE_RESOLVED', decision, jobId: dispute.job_id });
    if (vendorId) this.realtime.emitNotification(vendorId, { kind: 'DISPUTE_RESOLVED', decision, jobId: dispute.job_id });
    return { disputeId, decision, amount };
  }
}
