import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WalletService } from '../wallet/wallet.service';

function code(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Reverse Junk Auctions (master_specs Module 22). User posts junk; geofenced
 * Pro/Elite buyers bid CASH to buy it; highest offer wins; a pickup QR releases
 * payment. Buyer's funds lock on acceptance.
 */
@Injectable()
export class JunkService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
    private readonly wallet: WalletService,
  ) {}

  async create(sellerId: string, input: { title: string; photoUrl?: string; lat?: number; lng?: number }) {
    const db = requireDb(this.db);
    const row: Record<string, unknown> = { seller_id: sellerId, title: input.title, photo_url: input.photoUrl ?? null };
    if (input.lat != null && input.lng != null) row.location_geom = `SRID=4326;POINT(${input.lng} ${input.lat})`;
    const { data, error } = await db.from('junk_listings').insert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitNewListing({ kind: 'JUNK', listing: data });
    return data;
  }

  async list() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('junk_listings')
      .select('*')
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async get(junkId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('junk_listings').select('*').eq('junk_id', junkId).maybeSingle();
    if (!data) throw new NotFoundException('listing not found');
    return data;
  }

  async listBids(junkId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('junk_bids')
      .select('*')
      .eq('junk_id', junkId)
      .order('amount', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  /** Business places a cash offer to buy the junk. */
  async placeBid(buyerId: string, junkId: string, amount: number, pickupEta?: string) {
    const db = requireDb(this.db);
    const listing = await this.get(junkId);
    if (listing.status !== 'OPEN') throw new BadRequestException('listing closed');
    if (listing.seller_id === buyerId) throw new ForbiddenException('cannot bid on your own junk');
    const { data, error } = await db
      .from('junk_bids')
      .insert({ junk_id: junkId, buyer_id: buyerId, amount, pickup_eta: pickupEta ?? null })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitNotification(listing.seller_id, { kind: 'JUNK_OFFER', junkId, amount });
    return data;
  }

  /** Seller accepts an offer → buyer funds lock, pickup QR issued. */
  async acceptBid(sellerId: string, junkId: string, bidId: string) {
    const db = requireDb(this.db);
    const listing = await this.get(junkId);
    if (listing.seller_id !== sellerId) throw new ForbiddenException('not your listing');
    if (listing.status !== 'OPEN') throw new BadRequestException('already resolved');

    const { data: bid } = await db.from('junk_bids').select('*').eq('bid_id', bidId).maybeSingle();
    if (!bid || bid.junk_id !== junkId) throw new NotFoundException('bid not found');

    await this.wallet.hold({ userId: bid.buyer_id, amount: Number(bid.amount), kind: 'GOODS_PURCHASE', refId: junkId, note: `junk pickup ${listing.title}` });
    const pickup = code();
    await db.from('junk_bids').update({ status: 'WON' }).eq('bid_id', bidId);
    await db.from('junk_bids').update({ status: 'LOST' }).eq('junk_id', junkId).neq('bid_id', bidId);
    const { data, error } = await db
      .from('junk_listings')
      .update({ status: 'ACCEPTED', accepted_bid_id: bidId, pickup_code: pickup })
      .eq('junk_id', junkId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitNotification(bid.buyer_id, { kind: 'JUNK_ACCEPTED', junkId, pickupCode: pickup });
    return { ...data, pickup_code: pickup };
  }

  /** Seller confirms pickup with the buyer's QR → release payment to seller. */
  async confirmPickup(sellerId: string, junkId: string, pickupCode: string) {
    const db = requireDb(this.db);
    const listing = await this.get(junkId);
    if (listing.seller_id !== sellerId) throw new ForbiddenException('not your listing');
    if (listing.status !== 'ACCEPTED') throw new BadRequestException('not awaiting pickup');
    if (listing.pickup_code !== pickupCode) throw new BadRequestException('invalid pickup code');

    const { data: bid } = await db.from('junk_bids').select('*').eq('bid_id', listing.accepted_bid_id).maybeSingle();
    if (!bid) throw new NotFoundException('accepted bid missing');

    await this.wallet.releaseLocked({ fromUserId: bid.buyer_id, amount: Number(bid.amount), toUserId: sellerId, kind: 'GOODS_SALE', note: 'junk pickup confirmed' });
    const { data, error } = await db
      .from('junk_listings')
      .update({ status: 'PICKED_UP', resolved_at: new Date().toISOString() })
      .eq('junk_id', junkId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
