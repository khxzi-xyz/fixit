import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { ModerationService } from '../moderation/moderation.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

const UNLOCKED_JOB_STATUSES = ['BID_SELECTED', 'IN_PROGRESS', 'COMPLETED'];

/**
 * In-app chat (PRD §1.A.1 step 6, §2.A.4). Unlocks ONLY post-funding. Every
 * message is moderation-scanned (Tier 1 sync + Tier 2 async); flagged messages
 * persist as PENDING_REVIEW and are excluded from the public read at the query
 * layer. Clean messages broadcast in real time.
 */
@Injectable()
export class ChatService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly moderation: ModerationService,
    private readonly realtime: RealtimeGateway,
  ) {}

  private async ensureChannel(jobId: string, senderId: string) {
    const db = requireDb(this.db);
    const { data: job } = await db
      .from('jobs')
      .select('consumer_id, status')
      .eq('job_id', jobId)
      .maybeSingle();
    if (!job) throw new NotFoundException('job not found');
    if (!UNLOCKED_JOB_STATUSES.includes(job.status)) {
      throw new ForbiddenException('chat unlocks only after escrow funding');
    }

    const { data: bid } = await db
      .from('bids')
      .select('vendor_id')
      .eq('job_id', jobId)
      .eq('status', 'SELECTED')
      .maybeSingle();
    if (!bid) throw new NotFoundException('no selected vendor');

    const consumerId = job.consumer_id as string;
    const vendorId = bid.vendor_id as string;
    if (senderId !== consumerId && senderId !== vendorId) {
      throw new ForbiddenException('not a participant on this job');
    }

    // Upsert the channel (idempotent on job_id unique).
    const { data: existing } = await db
      .from('chat_channels')
      .select('channel_id')
      .eq('job_id', jobId)
      .maybeSingle();
    if (existing) return existing.channel_id as string;

    const { data, error } = await db
      .from('chat_channels')
      .insert({ job_id: jobId, consumer_id: consumerId, vendor_id: vendorId, unlocked_at: new Date().toISOString() })
      .select('channel_id')
      .single();
    if (error) throw new Error(error.message);
    return data.channel_id as string;
  }

  async send(jobId: string, senderId: string, body: string) {
    const db = requireDb(this.db);
    const channelId = await this.ensureChannel(jobId, senderId);

    // Persist first so the moderation pass has a content_ref_id to retract.
    const { data: msg, error } = await db
      .from('chat_messages')
      .insert({ channel_id: channelId, sender_id: senderId, body, message_type: 'TEXT', status: 'OPEN' })
      .select('message_id, created_at, status')
      .single();
    if (error) throw new Error(error.message);

    const recent = await this.recentContext(channelId, msg.message_id);
    const outcome = await this.moderation.scan({
      text: body,
      contentType: 'CHAT_MSG',
      contentRefId: msg.message_id,
      submittingUserId: senderId,
      context: recent,
    });

    // Tier-1 hits flip to PENDING_REVIEW synchronously; broadcast only clean msgs.
    if (outcome.status === 'OPEN') {
      this.realtime.emitChatMessage(jobId, { messageId: msg.message_id, senderId, body, messageType: 'TEXT', createdAt: msg.created_at });
    } else {
      await db.from('chat_messages').update({ status: 'PENDING_REVIEW' }).eq('message_id', msg.message_id);
    }
    return { messageId: msg.message_id, status: outcome.status };
  }

  /**
   * Voice / image message (master_specs Module 06). Raw voice notes are
   * WhatsApp-style: no moderation text pass, deliberately NO translation layer.
   * They broadcast instantly to the job room.
   */
  async sendMedia(jobId: string, senderId: string, input: { type: 'VOICE' | 'IMAGE'; mediaUrl: string; durationSecs?: number }) {
    const db = requireDb(this.db);
    const channelId = await this.ensureChannel(jobId, senderId);
    const { data: msg, error } = await db
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        sender_id: senderId,
        body: null,
        message_type: input.type,
        media_url: input.mediaUrl,
        media_duration_secs: input.durationSecs ?? null,
        status: 'OPEN',
      })
      .select('message_id, created_at, status')
      .single();
    if (error) throw new Error(error.message);

    this.realtime.emitChatMessage(jobId, {
      messageId: msg.message_id,
      senderId,
      messageType: input.type,
      mediaUrl: input.mediaUrl,
      durationSecs: input.durationSecs,
      createdAt: msg.created_at,
    });
    return { messageId: msg.message_id, status: 'OPEN' as const };
  }

  /** Only published messages (flagged ones excluded at the query layer). */
  async list(jobId: string, requesterId: string) {
    const db = requireDb(this.db);
    const { data: channel } = await db
      .from('chat_channels')
      .select('channel_id, consumer_id, vendor_id')
      .eq('job_id', jobId)
      .maybeSingle();
    if (!channel) return [];
    if (requesterId !== channel.consumer_id && requesterId !== channel.vendor_id) {
      throw new ForbiddenException('not a participant on this job');
    }
    const { data, error } = await db
      .from('chat_messages')
      .select('message_id, sender_id, body, message_type, media_url, media_duration_secs, created_at')
      .eq('channel_id', channel.channel_id)
      .eq('status', 'OPEN')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  private async recentContext(channelId: string, excludeId: string): Promise<string[]> {
    const db = this.db;
    if (!db) return [];
    const { data } = await db
      .from('chat_messages')
      .select('body, message_id')
      .eq('channel_id', channelId)
      .eq('status', 'OPEN')
      .order('created_at', { ascending: false })
      .limit(5);
    return (data ?? []).filter((m) => m.message_id !== excludeId).map((m) => m.body).reverse();
  }
}
