import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * Dynamic Service Catalog + multi-skill vendor tagging (master_specs Module 02).
 *  - A vendor proves each additional skill with a photo/cert; admin approves
 *    per-skill. Job visibility is filtered to APPROVED tags.
 *  - "Service Not Found → Request": admin approval creates a new category and a
 *    network-wide push fires.
 */
@Injectable()
export class CatalogService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
  ) {}

  async listCategories() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  // --- Per-skill vendor tagging ---------------------------------------------

  async requestSkillTag(vendorId: string, input: { categoryId: string; proofUrl?: string; proofNote?: string }) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('vendor_skill_tags')
      .upsert(
        {
          vendor_id: vendorId,
          category_id: input.categoryId,
          proof_url: input.proofUrl ?? null,
          proof_note: input.proofNote ?? null,
          status: 'PENDING',
        },
        { onConflict: 'vendor_id,category_id' },
      )
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listMySkillTags(vendorId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('vendor_skill_tags')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async pendingSkillTags() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('vendor_skill_tags')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  /** Admin approves/rejects a skill tag. On approval, add it to the vendor's
   *  category_ids so the routing/feed query starts matching it. */
  async resolveSkillTag(tagId: string, adminId: string, approve: boolean, note?: string) {
    const db = requireDb(this.db);
    const { data: tag } = await db.from('vendor_skill_tags').select('*').eq('tag_id', tagId).maybeSingle();
    if (!tag) throw new NotFoundException('skill tag not found');

    const { data, error } = await db
      .from('vendor_skill_tags')
      .update({
        status: approve ? 'APPROVED' : 'REJECTED',
        admin_id: adminId,
        admin_note: note ?? null,
        resolved_at: new Date().toISOString(),
      })
      .eq('tag_id', tagId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    if (approve) {
      const { data: profile } = await db
        .from('vendor_profiles')
        .select('category_ids')
        .eq('vendor_id', tag.vendor_id)
        .maybeSingle();
      const cats: string[] = profile?.category_ids ?? [];
      if (!cats.includes(tag.category_id)) {
        await db
          .from('vendor_profiles')
          .update({ category_ids: [...cats, tag.category_id] })
          .eq('vendor_id', tag.vendor_id);
      }
    }
    this.realtime.emitNotification(tag.vendor_id, {
      kind: approve ? 'SKILL_APPROVED' : 'SKILL_REJECTED',
      categoryId: tag.category_id,
    });
    return data;
  }

  // --- "Request to Add Service" loop ----------------------------------------

  async requestService(userId: string, input: { proposedName: string; description?: string }) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('service_requests')
      .insert({ requested_by_user_id: userId, proposed_name: input.proposedName, description: input.description ?? null })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async pendingServiceRequests() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('service_requests')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  /** Admin approves a service request: create the category + network-wide ping. */
  async approveServiceRequest(requestId: string, adminId: string, input: { categoryId: string; displayName: string; iconKey?: string }) {
    const db = requireDb(this.db);
    const { data: reqRow } = await db.from('service_requests').select('*').eq('request_id', requestId).maybeSingle();
    if (!reqRow) throw new NotFoundException('service request not found');
    if (reqRow.status !== 'PENDING') throw new BadRequestException(`already ${reqRow.status}`);

    await db
      .from('categories')
      .upsert({ category_id: input.categoryId, display_name: input.displayName, icon_key: input.iconKey ?? null, sort_order: 99 });

    const { data, error } = await db
      .from('service_requests')
      .update({ status: 'APPROVED', approved_category_id: input.categoryId, admin_id: adminId, resolved_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);

    // Network-wide notification (Module 02): "New Service Unlocked".
    this.realtime.emitAvailabilityUpdate({ event: 'NEW_SERVICE', categoryId: input.categoryId, displayName: input.displayName });
    return data;
  }

  async rejectServiceRequest(requestId: string, adminId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('service_requests')
      .update({ status: 'REJECTED', admin_id: adminId, resolved_at: new Date().toISOString() })
      .eq('request_id', requestId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }
}
