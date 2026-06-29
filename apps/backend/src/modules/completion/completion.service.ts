import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PayoutService } from '../warranty/payout.service';

/**
 * Triple-Verify completion (master_specs Module 06). Before / vendor-after /
 * consumer-after photos, all via in-app camera. The completion request only
 * unlocks once BOTH "after" photos exist; the consumer's final YES releases the
 * rolling warranty payout, NO freezes escrow and opens a dispute.
 */
@Injectable()
export class CompletionService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
    private readonly payouts: PayoutService,
  ) {}

  private async loadJob(jobId: string) {
    const db = requireDb(this.db);
    const { data: job } = await db.from('jobs').select('job_id, consumer_id, status').eq('job_id', jobId).maybeSingle();
    if (!job) throw new NotFoundException('job not found');
    return job;
  }

  private async assignedVendor(jobId: string) {
    const db = requireDb(this.db);
    const { data: bid } = await db
      .from('bids')
      .select('vendor_id')
      .eq('job_id', jobId)
      .eq('status', 'SELECTED')
      .maybeSingle();
    return bid?.vendor_id as string | undefined;
  }

  private async ensureCompletionRow(jobId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('job_completions').select('*').eq('job_id', jobId).maybeSingle();
    if (data) return data;
    const { data: created, error } = await db.from('job_completions').insert({ job_id: jobId }).select('*').single();
    if (error) throw new BadRequestException(error.message);
    return created;
  }

  /** Upload one of the three Triple-Verify photos. */
  async uploadPhoto(jobId: string, userId: string, phase: 'BEFORE' | 'VENDOR_AFTER' | 'CONSUMER_AFTER', url: string, capturedInApp = true) {
    const db = requireDb(this.db);
    const job = await this.loadJob(jobId);
    const vendorId = await this.assignedVendor(jobId);

    // Authorize the phase to the right party.
    if (phase === 'VENDOR_AFTER' && userId !== vendorId) throw new ForbiddenException('only the assigned vendor uploads VENDOR_AFTER');
    if (phase === 'CONSUMER_AFTER' && userId !== job.consumer_id) throw new ForbiddenException('only the consumer uploads CONSUMER_AFTER');

    const { data, error } = await db
      .from('job_photos')
      .insert({ job_id: jobId, uploaded_by_user_id: userId, phase, url, captured_in_app: capturedInApp })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    const completion = await this.ensureCompletionRow(jobId);
    const patch: Record<string, unknown> = {};
    if (phase === 'VENDOR_AFTER') patch.vendor_after_at = new Date().toISOString();
    if (phase === 'CONSUMER_AFTER') patch.consumer_after_at = new Date().toISOString();
    if (Object.keys(patch).length) {
      await db.from('job_completions').update(patch).eq('job_id', jobId);
    }

    this.realtime.emitCompletionUpdate(jobId, { event: 'PHOTO_UPLOADED', phase, photo: data });
    // Vendor "after" triggers the consumer prompt.
    if (phase === 'VENDOR_AFTER') {
      this.realtime.emitNotification(job.consumer_id, { kind: 'VERIFY_COMPLETION', jobId });
    }
    return { photo: data, completion: { ...completion, ...patch } };
  }

  async listPhotos(jobId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('job_photos')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async getStatus(jobId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('job_completions').select('*').eq('job_id', jobId).maybeSingle();
    return data ?? null;
  }

  /**
   * Consumer's final answer to "Is the Job Done?".
   *  YES → mark COMPLETED, bind warranty payout schedule (60% immediate).
   *  NO  → freeze, open a dispute for human review of the photos.
   */
  async confirm(jobId: string, consumerId: string, answer: 'YES' | 'NO', reason?: string) {
    const db = requireDb(this.db);
    const job = await this.loadJob(jobId);
    if (job.consumer_id !== consumerId) throw new ForbiddenException('not your job');

    const completion = await this.ensureCompletionRow(jobId);
    if (!completion.vendor_after_at || !completion.consumer_after_at) {
      throw new BadRequestException('both "after" photos are required before confirmation');
    }

    if (answer === 'YES') {
      await db
        .from('job_completions')
        .update({ consumer_confirmed: 'YES', confirmed_at: new Date().toISOString() })
        .eq('job_id', jobId);
      await db.from('jobs').update({ status: 'COMPLETED' }).eq('job_id', jobId);

      // Free the vendor's single-job Busy lock now that the job is done.
      const vendorId = await this.assignedVendor(jobId);
      if (vendorId) {
        await db.from('vendor_profiles').update({ is_busy: false, busy_job_id: null }).eq('vendor_id', vendorId).then(() => undefined, () => undefined);
      }

      // Bind the rolling payout (60% releases immediately). Warranty terms
      // should already be agreed; createSchedule is idempotent.
      let schedule = null;
      try {
        schedule = await this.payouts.createSchedule(jobId);
      } catch {
        // warranty terms may not be agreed yet; the agree() flow will create it
      }
      this.realtime.emitCompletionUpdate(jobId, { event: 'CONFIRMED_YES', schedule });
      return { status: 'COMPLETED', schedule };
    }

    // NO → dispute
    const { data: dispute } = await db
      .from('disputes')
      .insert({
        job_id: jobId,
        milestone_index: 0,
        opened_by_user_id: consumerId,
        reason: reason ?? 'Consumer marked job not done at Triple-Verify',
        sla_due_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      })
      .select('dispute_id')
      .single();

    await db
      .from('job_completions')
      .update({ consumer_confirmed: 'NO', confirmed_at: new Date().toISOString(), dispute_id: dispute?.dispute_id ?? null })
      .eq('job_id', jobId);
    await db.from('jobs').update({ status: 'IN_PROGRESS' }).eq('job_id', jobId);

    this.realtime.emitDisputeOpened({ jobId, disputeId: dispute?.dispute_id, reason });
    this.realtime.emitCompletionUpdate(jobId, { event: 'CONFIRMED_NO', disputeId: dispute?.dispute_id });
    return { status: 'DISPUTED', disputeId: dispute?.dispute_id };
  }
}
