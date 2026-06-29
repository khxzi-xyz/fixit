import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * In-App Parts Funding (master_specs Fix 2) — replaces the forgeable
 * multi-receipt log and unsupervised "escort mode". Vendor requests an
 * amount in-app, consumer approves/declines, vendor proves install with a
 * photo + serial. No cash, no paper receipts.
 */
@Injectable()
export class PartsFundingService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
  ) {}

  async request(jobId: string, vendorId: string, description: string, amount: number) {
    const db = requireDb(this.db);
    if (amount <= 0) throw new BadRequestException('amount must be positive');

    const { data, error } = await db
      .from('parts_funding_requests')
      .insert({ job_id: jobId, vendor_id: vendorId, description, amount, status: 'PENDING' })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    this.realtime.emitPartsFundingUpdate(jobId, data);
    return data;
  }

  async approve(requestId: string, consumerId: string) {
    return this.decide(requestId, consumerId, 'APPROVED');
  }

  async decline(requestId: string, consumerId: string) {
    return this.decide(requestId, consumerId, 'DECLINED');
  }

  private async decide(requestId: string, consumerId: string, status: 'APPROVED' | 'DECLINED') {
    const db = requireDb(this.db);
    const reqRow = await this.requirePending(requestId);

    const { data: job } = await db.from('jobs').select('consumer_id').eq('job_id', reqRow.job_id).maybeSingle();
    if (!job || job.consumer_id !== consumerId) throw new ForbiddenException('not the consumer for this job');

    const { data, error } = await db
      .from('parts_funding_requests')
      .update({ status, decided_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    this.realtime.emitPartsFundingUpdate(reqRow.job_id, data);
    return data;
  }

  async markInstalled(requestId: string, vendorId: string, photoUrl: string, serial: string) {
    const db = requireDb(this.db);
    const { data: reqRow } = await db.from('parts_funding_requests').select('*').eq('request_id', requestId).maybeSingle();
    if (!reqRow) throw new NotFoundException('parts funding request not found');
    if (reqRow.vendor_id !== vendorId) throw new ForbiddenException('not the vendor for this request');
    if (reqRow.status !== 'APPROVED') throw new BadRequestException('request is not approved');

    const { data, error } = await db
      .from('parts_funding_requests')
      .update({
        status: 'INSTALLED',
        installed_photo_url: photoUrl,
        installed_serial: serial,
        installed_at: new Date().toISOString(),
      })
      .eq('request_id', requestId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    this.realtime.emitPartsFundingUpdate(reqRow.job_id, data);
    return data;
  }

  async listForJob(jobId: string) {
    const db = requireDb(this.db);
    const { data } = await db
      .from('parts_funding_requests')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    return data ?? [];
  }

  private async requirePending(requestId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('parts_funding_requests').select('*').eq('request_id', requestId).maybeSingle();
    if (!data) throw new NotFoundException('parts funding request not found');
    if (data.status !== 'PENDING') throw new BadRequestException(`request already ${data.status}`);
    return data;
  }
}
