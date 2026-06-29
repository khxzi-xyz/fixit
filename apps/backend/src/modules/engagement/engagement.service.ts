import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';

/** Reviews (gated behind escrow clearance) + the in-app notifications feed. */
@Injectable()
export class EngagementService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) {}

  // --- Reviews (master_specs §1.A.1 step 8) ---------------------------------
  async createReview(jobId: string, consumerId: string, rating: number, body?: string) {
    const db = requireDb(this.db);
    const { data: job } = await db.from('jobs').select('consumer_id, status').eq('job_id', jobId).maybeSingle();
    if (!job) throw new BadRequestException('job not found');
    if (job.consumer_id !== consumerId) throw new ForbiddenException('not your job');
    if (job.status !== 'COMPLETED') throw new BadRequestException('review unlocks only after the job clears');

    const { data: bid } = await db.from('bids').select('vendor_id').eq('job_id', jobId).eq('status', 'SELECTED').maybeSingle();
    if (!bid) throw new BadRequestException('no vendor on this job');

    const { data, error } = await db
      .from('reviews')
      .upsert({ job_id: jobId, consumer_id: consumerId, vendor_id: bid.vendor_id, rating, body: body ?? null }, { onConflict: 'job_id' })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    // Recompute the vendor's rolling rating.
    const { data: rows } = await db.from('reviews').select('rating').eq('vendor_id', bid.vendor_id);
    const list = rows ?? [];
    const avg = list.length ? list.reduce((s, r) => s + Number(r.rating), 0) / list.length : rating;
    await db.from('vendor_profiles').update({ rating_avg: Math.round(avg * 100) / 100 }).eq('vendor_id', bid.vendor_id);
    return data;
  }

  async vendorReviews(vendorId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('reviews').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false }).limit(50);
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async myReview(jobId: string, consumerId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('reviews').select('*').eq('job_id', jobId).eq('consumer_id', consumerId).maybeSingle();
    return data ?? null;
  }

  // --- Notifications feed ----------------------------------------------------
  async myNotifications(userId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async markRead(userId: string) {
    const db = requireDb(this.db);
    await db.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null);
    return { ok: true };
  }
}
