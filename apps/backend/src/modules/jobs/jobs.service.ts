import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { ModerationService } from '../moderation/moderation.service';
import { RoutingService } from '../routing/routing.service';
import { AiService } from '../ai/ai.service';

export interface CreateJobInput {
  categoryId: string;
  subIssueTags?: string[];
  urgency: 'EMERGENCY' | 'TODAY' | 'THIS_WEEK' | 'FLEXIBLE';
  description?: string;
  lat: number;
  lng: number;
  budgetMin?: number;
  budgetMax?: number;
  postingKind?: 'STANDARD' | 'BOUNTY' | 'AUCTION';
  bountyPrice?: number;
  aiRewritten?: boolean;
  originalDescription?: string;
  mediaUrls?: string[];
}

@Injectable()
export class JobsService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly moderation: ModerationService,
    private readonly routing: RoutingService,
    private readonly ai: AiService,
  ) { }

  /**
   * Create a Job Card. The description is moderation-scanned BEFORE publish
   * (PRD §2.A.1): a clean card goes straight to OPEN and is routed; a flagged
   * card stays PENDING_REVIEW and is never shown to vendors.
   */
  async create(consumerId: string, input: CreateJobInput) {
    const db = requireDb(this.db);

    const hasVideo = input.mediaUrls?.some(url => url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'));

    const insert = await db
      .from('jobs')
      .insert({
        consumer_id: consumerId,
        category_id: input.categoryId,
        sub_issue_tags: input.subIssueTags ?? [],
        urgency: input.urgency,
        description: input.description ?? null,
        original_description: input.originalDescription ?? null,
        ai_rewritten: input.aiRewritten ?? false,
        location_geom: `SRID=4326;POINT(${input.lng} ${input.lat})`,
        budget_range_min: input.budgetMin ?? null,
        budget_range_max: input.budgetMax ?? null,
        posting_kind: input.postingKind ?? 'STANDARD',
        bounty_price: input.postingKind === 'BOUNTY' ? input.bountyPrice ?? null : null,
        status: 'PENDING_REVIEW',
      })
      .select('*')
      .single();
    if (insert.error) throw new BadRequestException(insert.error.message);
    const job = insert.data;

    // Best-effort: persist attached photos. Non-fatal if the column isn't
    // present yet (run migration 0014_job_media.sql to enable).
    if (input.mediaUrls?.length) {
      await db.from('jobs').update({ media_urls: input.mediaUrls }).eq('job_id', job.job_id)
        .then(() => undefined, () => undefined);
    }

    let status: 'OPEN' | 'PENDING_REVIEW' = 'OPEN';
    if (input.description?.trim()) {
      const outcome = await this.moderation.scan({
        text: input.description,
        contentType: 'JOB_DESC',
        contentRefId: job.job_id,
        submittingUserId: consumerId,
      });
      status = outcome.status;
    }

    await db.from('jobs').update({ status }).eq('job_id', job.job_id);
    await db.from('qa_threads').insert({ job_id: job.job_id });

    // Internal fair-price estimate (admin/system only) for the bid-floor guard.
    if (input.description?.trim()) {
      this.ai
        .estimateAndStore(job.job_id, input.description, input.categoryId)
        .catch(() => undefined);
    }

    if (status === 'OPEN') this.routing.publish(job.job_id);
    return { ...job, status };
  }

  async get(jobId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('jobs').select('*').eq('job_id', jobId).maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('job not found');
    return data;
  }

  /** A consumer's own jobs. */
  async listForConsumer(consumerId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('jobs')
      .select('*')
      .eq('consumer_id', consumerId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Vendor job feed -only OPEN jobs the vendor is eligible for (category +
   *  geo + verification enforced in the DB function, PRD §2.A.2 isolation). */
  async feedForVendor(vendorId: string) {
    const db = requireDb(this.db);
    const { data: profile } = await db
      .from('vendor_profiles')
      .select('category_ids')
      .eq('vendor_id', vendorId)
      .maybeSingle();
    if (!profile) return [];
    const { data, error } = await db
      .from('jobs')
      .select('job_id, tracking_id, category_id, sub_issue_tags, urgency, description, budget_range_min, budget_range_max, created_at, media_urls')
      .eq('status', 'OPEN')
      .in('category_id', profile.category_ids)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Jobs a vendor has won (has a SELECTED bid on) -their active work queue. */
  async listForVendor(vendorId: string) {
    const db = requireDb(this.db);
    const { data: bids, error: bidsError } = await db
      .from('bids')
      .select('job_id')
      .eq('vendor_id', vendorId)
      .eq('status', 'SELECTED');
    if (bidsError) throw new BadRequestException(bidsError.message);
    const jobIds = (bids ?? []).map((b) => b.job_id);
    if (jobIds.length === 0) return [];

    const { data, error } = await db
      .from('jobs')
      .select('*')
      .in('job_id', jobIds)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async submitReview(consumerId: string, jobId: string, rating: number, comment?: string) {
    const db = requireDb(this.db);
    const { data: job, error: jobError } = await db
      .from('jobs')
      .select('assigned_vendor_id, status')
      .eq('job_id', jobId)
      .eq('consumer_id', consumerId)
      .single();
    if (jobError || !job) throw new BadRequestException('Job not found or not yours');
    if (!job.assigned_vendor_id) throw new BadRequestException('Job has no vendor');

    const { data, error } = await db.from('reviews').insert({
      job_id: jobId,
      reviewer_id: consumerId,
      vendor_id: job.assigned_vendor_id,
      rating,
      content: comment,
    }).select().single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
