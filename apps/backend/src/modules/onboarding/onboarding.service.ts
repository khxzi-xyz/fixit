import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { StorageService } from '../storage/storage.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/** KYC documents + saved addresses + support tickets (100-page Zones 1/4/8). */
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly storage: StorageService,
    private readonly realtime: RealtimeGateway,
  ) {}

  // --- KYC -------------------------------------------------------------------
  async uploadDocument(vendorId: string, documentType: string, dataUrl: string) {
    const db = requireDb(this.db);
    const { url } = await this.storage.uploadDataUrl(vendorId, dataUrl, 'kyc');
    const { data, error } = await db
      .from('vendor_documents')
      .insert({ vendor_id: vendorId, document_type: documentType, storage_url: url })
      .select('*')
      .maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return data ?? { storage_url: url, document_type: documentType, status: 'UNDER_REVIEW' };
  }

  async myDocuments(vendorId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('vendor_documents').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
    return data ?? [];
  }

  /** Vendor submits for review — flips profile to PENDING. */
  async submitForReview(vendorId: string) {
    const db = requireDb(this.db);
    await db.from('vendor_profiles').update({ verification_status: 'PENDING' }).eq('vendor_id', vendorId);
    return { status: 'PENDING' };
  }

  async kycQueue() {
    const db = requireDb(this.db);
    const { data } = await db.from('vendor_documents').select('*').eq('status', 'UNDER_REVIEW').order('created_at', { ascending: true });
    return data ?? [];
  }

  async resolveDocument(documentId: string, adminId: string, approve: boolean, reason?: string) {
    const db = requireDb(this.db);
    const { data: doc } = await db.from('vendor_documents').select('vendor_id').eq('document_id', documentId).maybeSingle();
    if (!doc) throw new NotFoundException('document not found');
    await db.from('vendor_documents').update({
      status: approve ? 'APPROVED' : 'REJECTED', admin_id: adminId, rejection_reason: reason ?? null, resolved_at: new Date().toISOString(),
    }).eq('document_id', documentId);
    // If all docs approved, verify the vendor.
    if (approve) {
      const { data: pending } = await db.from('vendor_documents').select('document_id').eq('vendor_id', doc.vendor_id).neq('status', 'APPROVED');
      if (!pending || pending.length === 0) {
        await db.from('vendor_profiles').update({ verification_status: 'VERIFIED' }).eq('vendor_id', doc.vendor_id);
      }
    }
    this.realtime.emitNotification(doc.vendor_id, { kind: approve ? 'KYC_APPROVED' : 'KYC_REJECTED', reason });
    return { documentId, approve };
  }

  // --- Addresses -------------------------------------------------------------
  async addresses(userId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('user_addresses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data ?? [];
  }
  async addAddress(userId: string, label: string, lat?: number, lng?: number, details?: string) {
    const db = requireDb(this.db);
    const row: Record<string, unknown> = { user_id: userId, label, details: details ?? null };
    if (lat != null && lng != null) row.geom = `SRID=4326;POINT(${lng} ${lat})`;
    const { data, error } = await db.from('user_addresses').insert(row).select('*').maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
  async deleteAddress(userId: string, addressId: string) {
    const db = requireDb(this.db);
    await db.from('user_addresses').delete().eq('address_id', addressId).eq('user_id', userId);
    return { ok: true };
  }

  // --- Support ---------------------------------------------------------------
  async myTickets(userId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('support_tickets').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data ?? [];
  }
  async createTicket(userId: string, subject: string, body?: string) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('support_tickets').insert({ user_id: userId, subject, body: body ?? null }).select('*').maybeSingle();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
  async ticketQueue() {
    const db = requireDb(this.db);
    const { data } = await db.from('support_tickets').select('*').in('status', ['OPEN', 'PENDING']).order('created_at', { ascending: true });
    return data ?? [];
  }
  async replyTicket(ticketId: string, reply: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('support_tickets').update({ admin_reply: reply, status: 'RESOLVED' }).eq('ticket_id', ticketId).select('*').maybeSingle();
    return data;
  }
}
