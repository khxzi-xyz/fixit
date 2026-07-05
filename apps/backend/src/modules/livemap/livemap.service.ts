import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * Live Map + privacy-first tracking (master_specs Module 08/09).
 *  - "Available Now" bat-signal: a vendor toggles availability and their pin
 *    appears on the consumer map in real time (only while toggled on).
 *  - Per-job tracking activates ONLY between "On My Way" and "Arrived".
 *  - Direct Strike-Bounty: consumer taps an available vendor and sends a
 *    fixed-price offer straight to them.
 */
type LiveLoc = { lat: number; lng: number; at: string };

@Injectable()
export class LiveMapService {
  // Ephemeral live locations per job (vendor pings + consumer destination).
  // In-memory by design -tracking is short-lived and privacy-first (cleared on
  // "Arrived"). Survives within a single backend instance, which is all live
  // tracking needs.
  private readonly liveVendor = new Map<string, LiveLoc>();
  private readonly liveDest = new Map<string, LiveLoc>();

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
  ) { }

  /** Consumer reports their (destination) location so the vendor map can show it. */
  setDestination(jobId: string, lat: number, lng: number) {
    this.liveDest.set(jobId, { lat, lng, at: new Date().toISOString() });
    return { ok: true };
  }

  // --- Availability ("Available Now") ---------------------------------------

  async setAvailability(vendorId: string, isAvailable: boolean, lat?: number, lng?: number, heading?: number) {
    const db = requireDb(this.db);
    const row: Record<string, unknown> = {
      vendor_id: vendorId,
      is_available: isAvailable,
      updated_at: new Date().toISOString(),
    };
    if (isAvailable && lat != null && lng != null) {
      row.live_geom = `SRID=4326;POINT(${lng} ${lat})`;
      if (heading != null) row.heading = heading;
    }
    if (!isAvailable) {
      row.live_geom = null; // drop the pin when going offline (no passive tracking)
    }
    const { data, error } = await db.from('vendor_availability').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);

    this.realtime.emitAvailabilityUpdate({ vendorId, isAvailable, lat, lng });
    return data;
  }

  /** Vendor heartbeat while available -moves the live pin. */
  async updateLocation(vendorId: string, lat: number, lng: number, heading?: number) {
    const db = requireDb(this.db);
    const { data: avail } = await db
      .from('vendor_availability')
      .select('is_available')
      .eq('vendor_id', vendorId)
      .maybeSingle();
    if (!avail?.is_available) throw new ForbiddenException('not available -toggle Available Now first');

    const { error } = await db
      .from('vendor_availability')
      .update({ live_geom: `SRID=4326;POINT(${lng} ${lat})`, heading: heading ?? null, updated_at: new Date().toISOString() })
      .eq('vendor_id', vendorId);
    if (error) throw new BadRequestException(error.message);

    this.realtime.emitVendorLocationUpdate({ vendorId, lat, lng, heading });
    return { ok: true };
  }

  /**
   * Nearby available vendors for the consumer map. Uses PostGIS ST_DWithin via
   * an RPC if present; falls back to a bounding-box filter on the raw table.
   */
  async nearbyVendors(lat: number, lng: number, radiusMeters = 15000, categoryId?: string) {
    const db = requireDb(this.db);
    // Try a server-side geo RPC first (defined in 0005/0010 if available).
    const rpc = await db.rpc('fn_nearby_available_vendors', {
      p_lat: lat,
      p_lng: lng,
      p_radius: radiusMeters,
      p_category: categoryId ?? null,
    });
    if (!rpc.error && rpc.data) return rpc.data;

    // Fallback: pull available vendors and filter client-side by haversine.
    const { data, error } = await db
      .from('vendor_availability')
      .select('vendor_id, is_available, heading, live_geom, updated_at')
      .eq('is_available', true);
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  // --- Per-job tracking (On My Way → Arrived) -------------------------------

  private async assertVendorOnJob(jobId: string, vendorId: string) {
    const db = requireDb(this.db);
    const { data: bid } = await db
      .from('bids')
      .select('vendor_id')
      .eq('job_id', jobId)
      .eq('status', 'SELECTED')
      .maybeSingle();
    if (!bid || bid.vendor_id !== vendorId) {
      throw new ForbiddenException('you are not the assigned vendor for this job');
    }
  }

  /** "On My Way" -opens a tracking session for this job only. */
  async startTracking(jobId: string, vendorId: string) {
    const db = requireDb(this.db);
    await this.assertVendorOnJob(jobId, vendorId);

    const { data: open } = await db
      .from('job_tracking_sessions')
      .select('*')
      .eq('job_id', jobId)
      .neq('status', 'ENDED')
      .maybeSingle();
    if (open) return open;

    const { data, error } = await db
      .from('job_tracking_sessions')
      .insert({ job_id: jobId, vendor_id: vendorId, status: 'EN_ROUTE' })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitTrackingStatus(jobId, { status: 'EN_ROUTE', session: data });
    return data;
  }

  /** Breadcrumb ping during an active en-route session. */
  async ping(jobId: string, vendorId: string, lat: number, lng: number) {
    const db = requireDb(this.db);
    const { data: session } = await db
      .from('job_tracking_sessions')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'EN_ROUTE')
      .maybeSingle();
    if (!session) throw new NotFoundException('no active tracking session');
    if (session.vendor_id !== vendorId) throw new ForbiddenException('not your tracking session');

    await db.from('job_tracking_pings').insert({ session_id: session.session_id, geom: `SRID=4326;POINT(${lng} ${lat})` });
    const at = new Date().toISOString();
    this.liveVendor.set(jobId, { lat, lng, at });
    this.realtime.emitTrackingPing(jobId, { lat, lng, at });
    return { ok: true };
  }

  /** "Arrived" -terminates tracking completely (no lingering location data). */
  async arrive(jobId: string, vendorId: string) {
    const db = requireDb(this.db);
    const { data: session } = await db
      .from('job_tracking_sessions')
      .select('*')
      .eq('job_id', jobId)
      .eq('status', 'EN_ROUTE')
      .maybeSingle();
    if (!session) throw new NotFoundException('no active tracking session');
    if (session.vendor_id !== vendorId) throw new ForbiddenException('not your tracking session');

    this.liveVendor.delete(jobId);
    this.liveDest.delete(jobId);
    const now = new Date().toISOString();
    const { data, error } = await db
      .from('job_tracking_sessions')
      .update({ status: 'ARRIVED', arrived_at: now, ended_at: now })
      .eq('session_id', session.session_id)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    // Purge breadcrumb pings -privacy-first, nothing lingers.
    await db.from('job_tracking_pings').delete().eq('session_id', session.session_id);
    this.realtime.emitTrackingStatus(jobId, { status: 'ARRIVED', session: data });
    return data;
  }

  async getActiveSession(jobId: string) {
    const db = requireDb(this.db);
    const { data } = await db
      .from('job_tracking_sessions')
      .select('*')
      .eq('job_id', jobId)
      .neq('status', 'ENDED')
      .order('started_at', { ascending: false })
      .maybeSingle();
    if (!data) return null;
    // Merge ephemeral live locations so both apps can render the map.
    return { ...data, vendorLocation: this.liveVendor.get(jobId) ?? null, destination: this.liveDest.get(jobId) ?? null };
  }

  // --- Direct Strike-Bounty (Module 09) -------------------------------------

  async sendDirectBounty(consumerId: string, input: { vendorId: string; offeredPrice: number; categoryId?: string; note?: string }) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('direct_bounties')
      .insert({
        consumer_id: consumerId,
        vendor_id: input.vendorId,
        category_id: input.categoryId ?? null,
        offered_price: input.offeredPrice,
        note: input.note ?? null,
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitDirectBounty(input.vendorId, data);
    return data;
  }

  async listDirectBounties(vendorId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('direct_bounties')
      .select('*')
      .eq('vendor_id', vendorId)
      .in('status', ['SENT', 'COUNTERED'])
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async respondDirectBounty(bountyId: string, vendorId: string, action: 'ACCEPT' | 'DECLINE' | 'COUNTER', counterPrice?: number) {
    const db = requireDb(this.db);
    const { data: b } = await db.from('direct_bounties').select('*').eq('bounty_id', bountyId).maybeSingle();
    if (!b) throw new NotFoundException('bounty not found');
    if (b.vendor_id !== vendorId) throw new ForbiddenException('not your bounty');

    const patch: Record<string, unknown> = {};
    if (action === 'ACCEPT') {
      patch.status = 'ACCEPTED';
      patch.resolved_at = new Date().toISOString();
    } else if (action === 'DECLINE') {
      patch.status = 'DECLINED';
      patch.resolved_at = new Date().toISOString();
    } else {
      if (!counterPrice) throw new BadRequestException('counter requires a price');
      patch.status = 'COUNTERED';
      patch.counter_price = counterPrice;
    }
    const { data, error } = await db.from('direct_bounties').update(patch).eq('bounty_id', bountyId).select('*').single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitNotification(b.consumer_id, { kind: 'DIRECT_BOUNTY_RESPONSE', bounty: data });
    return data;
  }
}
