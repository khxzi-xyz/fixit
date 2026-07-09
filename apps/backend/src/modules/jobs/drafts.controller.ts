import { Body, Controller, Delete, Get, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, Roles, type AuthedRequest } from '../auth/jwt.guard';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';

@Injectable()
export class DraftsService {
  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) {}

  async getDraft(userId: string) {
    if (!this.db) return null;
    const { data, error } = await this.db
      .from('job_drafts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return null;
    return data;
  }

  async saveDraft(userId: string, draft: any) {
    if (!this.db) return null;
    const { error: delErr } = await this.db.from('job_drafts').delete().eq('user_id', userId);
    
    const { data, error } = await this.db.from('job_drafts').insert({
      user_id: userId,
      category_id: draft.categoryId || 'OTHER',
      urgency: draft.urgency || 'FLEXIBLE',
      description: draft.description || null,
      lat: draft.lat || 0,
      lng: draft.lng || 0,
      media_urls: draft.mediaUrls || [],
      updated_at: new Date().toISOString(),
    }).select().single();
    
    if (error) throw new Error(error.message);
    return data;
  }

  async deleteDraft(userId: string) {
    if (!this.db) return null;
    await this.db.from('job_drafts').delete().eq('user_id', userId);
    return { success: true };
  }
}

@Controller('job-drafts')
export class DraftsController {
  constructor(private readonly drafts: DraftsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @Roles('CONSUMER')
  get(@Req() req: AuthedRequest) {
    return this.drafts.getDraft(req.user!.sub);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  @Roles('CONSUMER')
  save(@Req() req: AuthedRequest, @Body() dto: any) {
    return this.drafts.saveDraft(req.user!.sub, dto);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @Roles('CONSUMER')
  delete(@Req() req: AuthedRequest) {
    return this.drafts.deleteDraft(req.user!.sub);
  }
}
