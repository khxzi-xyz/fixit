import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WalletService } from '../wallet/wallet.service';

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}
function code(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Open Marketplace (master_specs Module 19): peer-to-peer goods, fixed price or
 * auction. Flat 5% fee. Funds lock in escrow on deal; a QR handoff scan
 * releases them to the seller (minus the flat fee).
 */
@Injectable()
export class MarketplaceService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
    private readonly wallet: WalletService,
  ) {}

  async create(sellerId: string, input: {
    title: string; description?: string; photos?: string[]; categoryLabel?: string;
    saleKind: 'FIXED' | 'AUCTION'; price?: number; startingBid?: number;
    auctionHours?: number; lat?: number; lng?: number;
  }) {
    const db = requireDb(this.db);
    const row: Record<string, unknown> = {
      seller_id: sellerId,
      title: input.title,
      description: input.description ?? null,
      photos: input.photos ?? [],
      category_label: input.categoryLabel ?? null,
      sale_kind: input.saleKind,
    };
    if (input.saleKind === 'FIXED') {
      if (!input.price) throw new BadRequestException('fixed-price listing needs a price');
      row.price = input.price;
    } else {
      row.starting_bid = input.startingBid ?? 0;
      row.price = input.startingBid ?? 0;
      row.auction_ends_at = new Date(Date.now() + (input.auctionHours ?? 48) * 3600 * 1000).toISOString();
    }
    if (input.lat != null && input.lng != null) row.location_geom = `SRID=4326;POINT(${input.lng} ${input.lat})`;

    const { data, error } = await db.from('marketplace_listings').insert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitNewListing({ kind: 'GOODS', listing: data });
    return data;
  }

  async list(status = 'ACTIVE') {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('marketplace_listings')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async get(listingId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('marketplace_listings').select('*').eq('listing_id', listingId).maybeSingle();
    if (!data) throw new NotFoundException('listing not found');
    return data;
  }

  /** Fixed-price "Buy Now": lock the buyer's funds in escrow immediately. */
  async buyNow(buyerId: string, listingId: string) {
    const db = requireDb(this.db);
    const listing = await this.get(listingId);
    if (listing.sale_kind !== 'FIXED') throw new BadRequestException('not a fixed-price listing');
    if (listing.status !== 'ACTIVE') throw new BadRequestException('listing not available');
    if (listing.seller_id === buyerId) throw new ForbiddenException('cannot buy your own listing');

    await this.wallet.hold({ userId: buyerId, amount: Number(listing.price), kind: 'GOODS_PURCHASE', refId: listingId, note: `buy ${listing.title}` });
    const handoff = code();
    const { data, error } = await db
      .from('marketplace_listings')
      .update({ status: 'PENDING_HANDOFF', buyer_id: buyerId, sold_price: listing.price, handoff_code: handoff })
      .eq('listing_id', listingId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    this.realtime.emitListingUpdate(listingId, { event: 'SOLD_PENDING_HANDOFF', listing: data });
    this.realtime.emitNotification(listing.seller_id, { kind: 'GOODS_SOLD', listingId, handoffCode: handoff });
    return { ...data, handoff_code: handoff };
  }

  /** Auction bid. Highest bid stands; outbids are marked. */
  async placeBid(bidderId: string, listingId: string, amount: number) {
    const db = requireDb(this.db);
    const listing = await this.get(listingId);
    if (listing.sale_kind !== 'AUCTION') throw new BadRequestException('not an auction listing');
    if (listing.status !== 'ACTIVE') throw new BadRequestException('auction closed');
    if (listing.auction_ends_at && new Date(listing.auction_ends_at) < new Date()) {
      throw new BadRequestException('auction has ended');
    }
    if (amount <= Number(listing.price)) throw new BadRequestException(`bid must exceed current ${listing.price}`);

    await db.from('marketplace_bids').update({ status: 'OUTBID' }).eq('listing_id', listingId).eq('status', 'ACTIVE');
    const { data, error } = await db
      .from('marketplace_bids')
      .insert({ listing_id: listingId, bidder_id: bidderId, amount })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await db.from('marketplace_listings').update({ price: amount }).eq('listing_id', listingId);

    this.realtime.emitListingUpdate(listingId, { event: 'NEW_BID', amount, bidderId });
    return data;
  }

  /** Close an auction: highest bid wins, lock winner's funds. (Admin/cron/seller.) */
  async closeAuction(listingId: string, callerId: string) {
    const db = requireDb(this.db);
    const listing = await this.get(listingId);
    if (listing.seller_id !== callerId) throw new ForbiddenException('only the seller can close');
    if (listing.sale_kind !== 'AUCTION') throw new BadRequestException('not an auction');

    const { data: top } = await db
      .from('marketplace_bids')
      .select('*')
      .eq('listing_id', listingId)
      .order('amount', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!top) {
      await db.from('marketplace_listings').update({ status: 'EXPIRED' }).eq('listing_id', listingId);
      return { status: 'EXPIRED' };
    }

    await this.wallet.hold({ userId: top.bidder_id, amount: Number(top.amount), kind: 'GOODS_PURCHASE', refId: listingId, note: `won auction ${listing.title}` });
    const handoff = code();
    await db.from('marketplace_bids').update({ status: 'WON' }).eq('bid_id', top.bid_id);
    await db.from('marketplace_bids').update({ status: 'LOST' }).eq('listing_id', listingId).neq('bid_id', top.bid_id);
    const { data, error } = await db
      .from('marketplace_listings')
      .update({ status: 'PENDING_HANDOFF', buyer_id: top.bidder_id, sold_price: top.amount, handoff_code: handoff })
      .eq('listing_id', listingId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitListingUpdate(listingId, { event: 'AUCTION_WON', listing: data });
    this.realtime.emitNotification(top.bidder_id, { kind: 'AUCTION_WON', listingId, handoffCode: handoff });
    return { ...data, handoff_code: handoff };
  }

  /** Buyer scans the seller's QR at meetup → release funds (minus flat 5% fee). */
  async confirmHandoff(buyerId: string, listingId: string, handoffCode: string) {
    const db = requireDb(this.db);
    const listing = await this.get(listingId);
    if (listing.status !== 'PENDING_HANDOFF') throw new BadRequestException('not awaiting handoff');
    if (listing.buyer_id !== buyerId) throw new ForbiddenException('not the buyer');
    if (listing.handoff_code !== handoffCode) throw new BadRequestException('invalid handoff code');

    const price = Number(listing.sold_price);
    const fee = round3(price * 0.05);
    const sellerProceeds = round3(price - fee);

    // Release buyer's locked funds; credit seller net of fee.
    await this.wallet.releaseLocked({ fromUserId: buyerId, amount: price, toUserId: listing.seller_id, kind: 'GOODS_SALE', note: `sale ${listing.title} (−5% fee)` });
    // Adjust the seller credit to be net (releaseLocked credited full price; debit the fee).
    await this.wallet.post({ userId: listing.seller_id, kind: 'PLATFORM_FEE', amount: -fee, note: '5% goods fee' });

    const { data, error } = await db
      .from('marketplace_listings')
      .update({ status: 'SOLD' })
      .eq('listing_id', listingId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitListingUpdate(listingId, { event: 'HANDOFF_COMPLETE', listing: data });
    return { listing: data, fee, sellerProceeds };
  }
}
