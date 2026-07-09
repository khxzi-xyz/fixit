import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';

export interface UpsertVendorInput {
  categoryIds: string[];
  radiusMeters?: number;
  licenseDocUrl?: string;
  insuranceDocUrl?: string;
  insuranceExpiry?: string; // ISO date
  serviceAreaWkt?: string; // optional POLYGON WKT
}

@Injectable()
export class VendorsService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) {}

  async getProfile(vendorId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db.from('vendor_profiles').select('*').eq('vendor_id', vendorId).maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('vendor profile not found');
    return data;
  }

  /** Create/update a vendor profile (verification stays PENDING until admin acts). */
  async upsertProfile(vendorId: string, input: UpsertVendorInput) {
    const db = requireDb(this.db);
    const row: Record<string, unknown> = {
      vendor_id: vendorId,
      category_ids: input.categoryIds,
      radius_meters: input.radiusMeters ?? 15000,
      license_doc_url: input.licenseDocUrl,
      insurance_doc_url: input.insuranceDocUrl,
      insurance_expiry: input.insuranceExpiry,
    };
    if (input.serviceAreaWkt) {
      row.service_area_geom = `SRID=4326;${input.serviceAreaWkt}`;
    }
    const { data, error } = await db.from('vendor_profiles').upsert(row).select('*').single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Background location tracking */
  async updateLocation(vendorId: string, lat: number, lng: number) {
    const db = requireDb(this.db);
    const point = `SRID=4326;POINT(${lng} ${lat})`;
    const { data, error } = await db.from('vendor_profiles').update({ service_area_geom: point }).eq('vendor_id', vendorId).select('*').single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Admin: set verification status (PRD §1.A.2/§1.A.3). */
  async setVerification(vendorId: string, status: 'PENDING' | 'VERIFIED' | 'SUSPENDED') {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('vendor_profiles')
      .update({ verification_status: status })
      .eq('vendor_id', vendorId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Admin compliance dashboard: vendors with license/insurance + expiry. */
  async complianceList() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('vendor_profiles')
      .select('vendor_id, category_ids, verification_status, insurance_expiry, rating_avg, jobs_completed_count')
      .order('insurance_expiry', { ascending: true, nullsFirst: false });
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async getPublicProfile(vendorId: string) {
    const db = requireDb(this.db);
    const { data: profile, error } = await db.from('vendor_profiles').select('*').eq('vendor_id', vendorId).maybeSingle();
    if (error) throw new BadRequestException(error.message);
    if (!profile) throw new NotFoundException('vendor profile not found');
    
    const { data: user } = await db.from('users').select('full_name, avatar_url').eq('user_id', vendorId).maybeSingle();
    
    let categories: any[] = [];
    if (profile.category_ids?.length) {
      const { data: cats } = await db.from('categories').select('category_id, display_name').in('category_id', profile.category_ids);
      categories = cats || [];
    }

    return { ...profile, full_name: user?.full_name, avatar_url: user?.avatar_url, categories };
  }
}
