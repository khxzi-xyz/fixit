import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { TwilioClient } from './twilio.client';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * Masked calling is the post-funding comms channel. It UNLOCKS ONLY after
 * escrow funding (job status BID_SELECTED / IN_PROGRESS), which is the
 * platform's primary anti-disintermediation lever (PRD §2.A.4).
 */
const UNLOCKED_JOB_STATUSES = ['BID_SELECTED', 'IN_PROGRESS', 'COMPLETED'];

@Injectable()
export class TelephonyService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly twilio: TwilioClient,
    private readonly realtime: RealtimeGateway,
  ) {}

  async initiateMaskedCall(jobId: string, initiatorId: string) {
    const db = requireDb(this.db);

    // Resolve the job, its consumer, and the selected vendor.
    const { data: job } = await db
      .from('jobs')
      .select('job_id, consumer_id, status')
      .eq('job_id', jobId)
      .maybeSingle();
    if (!job) throw new NotFoundException('job not found');
    if (!UNLOCKED_JOB_STATUSES.includes(job.status)) {
      throw new ForbiddenException('calling unlocks only after escrow funding');
    }

    const { data: selectedBid } = await db
      .from('bids')
      .select('vendor_id')
      .eq('job_id', jobId)
      .eq('status', 'SELECTED')
      .maybeSingle();
    if (!selectedBid) throw new NotFoundException('no selected vendor for this job');

    const consumerId = job.consumer_id as string;
    const vendorId = selectedBid.vendor_id as string;
    if (initiatorId !== consumerId && initiatorId !== vendorId) {
      throw new ForbiddenException('not a participant on this job');
    }

    // Look up both real phone numbers (server-side only; never returned to clients).
    const { data: parties } = await db
      .from('users')
      .select('user_id, phone_number')
      .in('user_id', [consumerId, vendorId]);
    const phoneOf = (id: string) => parties?.find((p) => p.user_id === id)?.phone_number ?? '';

    const session = await this.twilio.createMaskedSession(phoneOf(consumerId), phoneOf(vendorId));

    const { data: row, error } = await db
      .from('call_sessions')
      .insert({
        job_id: jobId,
        initiator_id: initiatorId,
        consumer_id: consumerId,
        vendor_id: vendorId,
        provider: 'TWILIO_PROXY',
        provider_session_sid: session.sessionSid,
        proxy_number: session.proxyNumber,
        status: session.simulated ? 'SIMULATED' : 'INITIATED',
      })
      .select('call_session_id, status, proxy_number, created_at')
      .single();
    if (error) throw new Error(error.message);

    // Notify both parties' job room (real numbers are NOT in the payload).
    this.realtime.emitMilestoneUpdate(jobId, {
      type: 'CALL_INITIATED',
      callSessionId: row.call_session_id,
      proxyNumber: row.proxy_number,
      simulated: session.simulated,
    });
    return { ...row, simulated: session.simulated };
  }

  async history(jobId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('call_sessions')
      .select('call_session_id, status, proxy_number, created_at, ended_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }
}
