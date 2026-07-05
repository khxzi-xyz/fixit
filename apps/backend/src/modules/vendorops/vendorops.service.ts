import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';

/** Vendor ops: earnings analytics (from the wallet ledger), multi-staff team,
 *  and ad campaigns (100-page Zone 6 / Pages 50-58). */
@Injectable()
export class VendorOpsService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) { }

  /** Monthly earnings + totals derived from real wallet_transactions. */
  async analytics(vendorId: string) {
    const db = requireDb(this.db);
    const { data } = await db
      .from('wallet_transactions')
      .select('kind, amount, created_at')
      .eq('user_id', vendorId)
      .order('created_at', { ascending: true })
      .limit(500);
    const rows = data ?? [];
    const byMonth: Record<string, number> = {};
    let gross = 0, fees = 0, payouts = 0;
    for (const r of rows) {
      const a = Number(r.amount);
      const m = String(r.created_at).slice(0, 7);
      if (r.kind === 'VENDOR_PAYOUT_EARNED' || r.kind === 'GOODS_SALE') { byMonth[m] = (byMonth[m] ?? 0) + a; gross += a; }
      if (r.kind === 'PLATFORM_FEE') fees += Math.abs(a);
      if (r.kind === 'PAYOUT_WITHDRAWAL' && a < 0) payouts += Math.abs(a);
    }
    const series = Object.entries(byMonth).map(([month, total]) => ({ month, total: Math.round(total * 1000) / 1000 }));
    return { series, gross: Math.round(gross * 1000) / 1000, fees: Math.round(fees * 1000) / 1000, payouts: Math.round(payouts * 1000) / 1000, jobs: series.length };
  }

  // Team
  async listStaff(vendorId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('vendor_staff').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
    return data ?? [];
  }
  async addStaff(vendorId: string, name: string, phone?: string, vehicle?: string) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('vendor_staff').insert({ vendor_id: vendorId, name, phone: phone ?? null, vehicle_plate: vehicle ?? null }).select('*').maybeSingle();
    if (error) throw new BadRequestException(error.message);
    // multi-staff shops are exempt from the single-job Busy lock -bump staff_count
    const { count } = await db.from('vendor_staff').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId);
    await db.from('vendor_profiles').update({ staff_count: (count ?? 1) + 1 }).eq('vendor_id', vendorId).then(() => undefined, () => undefined);
    return data;
  }
  async removeStaff(vendorId: string, staffId: string) {
    const db = requireDb(this.db);
    await db.from('vendor_staff').delete().eq('staff_id', staffId).eq('vendor_id', vendorId);
    return { ok: true };
  }

  // Ads
  async myCampaigns(vendorId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('ad_campaigns').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
    return data ?? [];
  }
  async createCampaign(vendorId: string, input: { bannerUrl?: string; headline?: string; targetUrl?: string }) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('ad_campaigns').insert({ vendor_id: vendorId, banner_url: input.bannerUrl ?? null, headline: input.headline ?? null, target_url: input.targetUrl ?? null }).select('*').maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
  /** Public: active homepage banners (Page 11). */
  async activeBanners() {
    const db = requireDb(this.db);
    const { data } = await db.from('ad_campaigns').select('campaign_id, banner_url, headline, target_url').eq('status', 'ACTIVE').limit(8);
    return data ?? [];
  }
  async recordClick(campaignId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('ad_campaigns').select('clicks').eq('campaign_id', campaignId).maybeSingle();
    await db.from('ad_campaigns').update({ clicks: (data?.clicks ?? 0) + 1 }).eq('campaign_id', campaignId);
    return { ok: true };
  }

  // Admin
  async adQueue() {
    const db = requireDb(this.db);
    const { data } = await db.from('ad_campaigns').select('*').eq('status', 'AWAITING_REVIEW').order('created_at', { ascending: true });
    return data ?? [];
  }
  async resolveCampaign(campaignId: string, approve: boolean) {
    const db = requireDb(this.db);
    const { data } = await db.from('ad_campaigns').update({ status: approve ? 'ACTIVE' : 'REJECTED' }).eq('campaign_id', campaignId).select('*').maybeSingle();
    return data;
  }
}
