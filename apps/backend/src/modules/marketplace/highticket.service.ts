import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { WalletService } from '../wallet/wallet.service';

/**
 * High-Ticket Lead-Lock (master_specs Module 20). The platform NEVER holds the
 * sale price of a car/property. Buyers and sellers bargain in-app with contact
 * fully masked; a small refundable Lead-Lock deposit unlocks contact + the
 * inspection location, and a flat success fee is owed on a completed deal.
 */
@Injectable()
export class HighTicketService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
    private readonly wallet: WalletService,
  ) {}

  private flatFeeFor(itemClass: string): number {
    switch (itemClass) {
      case 'VEHICLE': return 15;
      case 'PROPERTY': return 25;
      case 'ELECTRONICS': return 3;
      default: return 5;
    }
  }

  async create(sellerId: string, input: {
    title: string; description?: string; photos?: string[];
    itemClass: 'VEHICLE' | 'ELECTRONICS' | 'PROPERTY' | 'OTHER'; askingPrice: number;
  }) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('high_ticket_listings')
      .insert({
        seller_id: sellerId,
        title: input.title,
        description: input.description ?? null,
        photos: input.photos ?? [],
        item_class: input.itemClass,
        asking_price: input.askingPrice,
        flat_lead_fee: this.flatFeeFor(input.itemClass),
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async list() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('high_ticket_listings')
      .select('*')
      .in('status', ['ACTIVE', 'NEGOTIATING'])
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async get(listingId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('high_ticket_listings').select('*').eq('listing_id', listingId).maybeSingle();
    if (!data) throw new NotFoundException('listing not found');
    return data;
  }

  /** Structured in-app offer/counter. Contact stays masked. */
  async makeOffer(userId: string, listingId: string, amount: number, party: 'BUYER' | 'SELLER') {
    const db = requireDb(this.db);
    const listing = await this.get(listingId);
    const { data, error } = await db
      .from('high_ticket_offers')
      .insert({ listing_id: listingId, buyer_id: userId, amount, party })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await db.from('high_ticket_listings').update({ status: 'NEGOTIATING' }).eq('listing_id', listingId);
    this.realtime.emitNotification(listing.seller_id, { kind: 'HIGH_TICKET_OFFER', listingId, offer: data });
    return data;
  }

  /** Pay the refundable Lead-Lock deposit → unlocks contact + location. */
  async lockLead(buyerId: string, offerId: string) {
    const db = requireDb(this.db);
    const { data: offer } = await db.from('high_ticket_offers').select('*').eq('offer_id', offerId).maybeSingle();
    if (!offer) throw new NotFoundException('offer not found');
    const listing = await this.get(offer.listing_id);

    // Hold the deposit in escrow (refundable). It credits toward the flat fee.
    const hold = await this.wallet.hold({
      userId: buyerId,
      amount: Number(listing.lead_lock_deposit),
      kind: 'LEAD_LOCK_FEE',
      refId: offer.listing_id,
      note: `lead-lock deposit ${listing.title}`,
    });

    const { data, error } = await db
      .from('high_ticket_offers')
      .update({ lead_locked: true })
      .eq('offer_id', offerId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    await db.from('high_ticket_listings').update({ status: 'LOCKED' }).eq('listing_id', offer.listing_id);

    // Now that the lead is locked, return the seller's contact (masked elsewhere).
    const { data: seller } = await db
      .from('users')
      .select('full_name, phone_number')
      .eq('user_id', listing.seller_id)
      .maybeSingle();

    this.realtime.emitNotification(listing.seller_id, { kind: 'LEAD_LOCKED', listingId: offer.listing_id });
    return { offer: data, deposit: hold, sellerContact: seller };
  }

  /** Deal closed in person → seller owes the flat fee (deposit credits toward it). */
  async completeSale(sellerId: string, listingId: string) {
    const db = requireDb(this.db);
    const listing = await this.get(listingId);
    if (listing.seller_id !== sellerId) throw new ForbiddenException('not the seller');
    await db.from('high_ticket_listings').update({ status: 'SOLD' }).eq('listing_id', listingId);
    this.realtime.emitListingUpdate(listingId, { event: 'HIGH_TICKET_SOLD' });
    return { status: 'SOLD', flatFee: Number(listing.flat_lead_fee) };
  }
}
