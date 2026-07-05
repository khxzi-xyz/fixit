import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * Asynchronous targeted routing (PRD §2.A.2). On JobCardPublished:
 *   1. PostGIS + category + verification + subscription filter (DB function)
 *   2. fan-out: notification row per eligible vendor + push token lookup
 *   3. bump notified_vendor_count for the live consumer-facing counter
 *
 * Dispatch is fire-and-forget so the HTTP request that published the job
 * returns immediately. In production, replace the in-process queue with
 * BullMQ/SQS (the dispatch() body is the worker handler).
 */
@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
  ) { }

  /** Enqueue routing without blocking the caller. */
  publish(jobId: string): void {
    setImmediate(() => {
      this.dispatch(jobId).catch((err) =>
        this.logger.error(`routing dispatch failed for ${jobId}: ${err.message}`),
      );
    });
  }

  /** The worker handler -idempotent enough to retry. */
  async dispatch(jobId: string): Promise<{ notified: number }> {
    const db = requireDb(this.db);

    const { data: vendors, error } = await db.rpc('eligible_vendors_for_job', { p_job_id: jobId });
    if (error) throw new Error(error.message);
    const vendorIds: string[] = (vendors ?? []).map((v: { vendor_id: string }) => v.vendor_id);

    if (vendorIds.length > 0) {
      const notifications = vendorIds.map((vid) => ({
        user_id: vid,
        kind: 'NEW_JOB',
        title: 'New job in your area',
        body: 'A job matching your category and radius is open for bids.',
        job_id: jobId,
      }));
      const ins = await db.from('notifications').insert(notifications);
      if (ins.error) this.logger.warn(`notification insert: ${ins.error.message}`);
    }

    await db.from('jobs').update({ notified_vendor_count: vendorIds.length }).eq('job_id', jobId);

    // Push the live counter + per-vendor feed signal over WebSocket.
    this.realtime.emitBidArrival(jobId, { type: 'ROUTED', notifiedVendorCount: vendorIds.length });
    this.logger.log(`job ${jobId} routed to ${vendorIds.length} vendor(s)`);
    return { notified: vendorIds.length };
  }
}
