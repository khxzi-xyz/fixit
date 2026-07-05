import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, AuthedRequest } from '../auth/jwt.guard';
import { Inject } from '@nestjs/common';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { SupabaseClient } from '@supabase/supabase-js';

@Controller('chat')
export class ChatController {
  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) {}

  @Get(':jobId')
  @UseGuards(JwtAuthGuard)
  async getMessages(@Param('jobId') jobId: string) {
    if (!this.db) return [];
    const { data } = await this.db
      .from('messages')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });
    return data || [];
  }

  @Post(':jobId')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Req() req: AuthedRequest, 
    @Param('jobId') jobId: string, 
    @Body() body: { content: string; mediaUrl?: string }
  ) {
    if (!this.db) return null;
    const { data } = await this.db.from('messages').insert({
      job_id: jobId,
      sender_id: req.user!.sub,
      content: body.content,
      media_url: body.mediaUrl || null
    }).select('*').single();
    return data;
  }

  @Post(':jobId/read')
  @UseGuards(JwtAuthGuard)
  async markRead(@Param('jobId') jobId: string, @Req() req: AuthedRequest) {
    if (!this.db) return { success: true };
    await this.db.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .is('read_at', null)
      .neq('sender_id', req.user!.sub);
    return { success: true };
  }
}
