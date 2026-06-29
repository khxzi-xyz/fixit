import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { PayoutService } from './payout.service';

/**
 * Peer-negotiated warranty (master_specs §07). The platform never invents a
 * term: vendor proposes days, consumer may counter, only mutual "agree" binds
 * it to the order. Zero-day warranties are a legitimate outcome.
 */
@Injectable()
export class WarrantyService {
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

  async propose(jobId: string, userId: string, days: number) {
    const db = requireDb(this.db);
    await this.loadJob(jobId);
    if (days < 0) throw new BadRequestException('warranty days cannot be negative');

    const { data, error } = await db
      .from('warranty_terms')
      .upsert(
        { job_id: jobId, proposed_by_user_id: userId, proposed_days: days, status: 'PROPOSED' },
        { onConflict: 'job_id' },
      )
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitWarrantyUpdate(jobId, data);
    return data;
  }

  async counter(jobId: string, userId: string, days: number) {
    const db = requireDb(this.db);
    const { data: existing } = await db.from('warranty_terms').select('*').eq('job_id', jobId).maybeSingle();
    if (!existing) throw new NotFoundException('no warranty proposal to counter');
    if (existing.proposed_by_user_id === userId) {
      throw new ForbiddenException('cannot counter your own proposal');
    }

    const { data, error } = await db
      .from('warranty_terms')
      .update({ countered_days: days, status: 'COUNTERED', updated_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitWarrantyUpdate(jobId, data);
    return data;
  }

  /** Either party accepts the latest number on the table (proposed or countered). */
  async agree(jobId: string, userId: string) {
    const db = requireDb(this.db);
    const job = await this.loadJob(jobId);
    const { data: term } = await db.from('warranty_terms').select('*').eq('job_id', jobId).maybeSingle();
    if (!term) throw new NotFoundException('no warranty terms proposed yet');
    if (term.status === 'AGREED') return term;

    const agreedDays = term.countered_days ?? term.proposed_days;
    const startsAt = new Date();
    const halfwayAt = new Date(startsAt.getTime() + (agreedDays / 2) * 86_400_000);
    const endsAt = new Date(startsAt.getTime() + agreedDays * 86_400_000);

    const { data, error } = await db
      .from('warranty_terms')
      .update({
        agreed_days: agreedDays,
        status: 'AGREED',
        starts_at: startsAt.toISOString(),
        halfway_at: halfwayAt.toISOString(),
        ends_at: endsAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('job_id', jobId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    this.realtime.emitWarrantyUpdate(jobId, data);
    // Triple-Verify completion is expected to have already happened; the
    // rolling payout schedule starts the moment warranty terms bind.
    await this.payouts.createSchedule(jobId);
    return data;
  }

  async get(jobId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('warranty_terms').select('*').eq('job_id', jobId).maybeSingle();
    return data ?? null;
  }
}
