import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { tier1Scan } from './tier1';
import { GeminiClient } from './gemini.client';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export type ContentType = 'JOB_DESC' | 'QA_THREAD' | 'CHAT_MSG';
export type ModerationStatus = 'OPEN' | 'PENDING_REVIEW';

export interface ModerationOutcome {
  status: ModerationStatus;
  tier1Match: boolean;
  reasons: string[];
  span?: string;
}

// Confidence-threshold routing (PRD §2.B.2).
const RETRACT_THRESHOLD = 0.85; // >85% → flag + retract content
const REVIEW_THRESHOLD = 0.4; //   40-85% → flag, do NOT retract

// Which table/column a flagged record lives in, for retraction.
const CONTENT_TABLE: Record<ContentType, { table: string; idCol: string }> = {
  JOB_DESC: { table: 'jobs', idCol: 'job_id' },
  QA_THREAD: { table: 'qa_entries', idCol: 'entry_id' },
  CHAT_MSG: { table: 'chat_messages', idCol: 'message_id' },
};

/**
 * Two-tier moderation (PRD §2.B). Tier 1 deterministic (sync, short-circuit);
 * Tier 2 Gemini semantic pass runs async and can retract optimistically-shown
 * content within seconds. Every decision is written to ai_audit_logs and admin
 * flags are pushed over WebSocket in real time.
 */
@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly config: ConfigService,
    private readonly gemini: GeminiClient,
    private readonly realtime: RealtimeGateway,
  ) {}

  async scan(params: {
    text: string;
    contentType: ContentType;
    contentRefId: string;
    submittingUserId: string;
    context?: string[];
  }): Promise<ModerationOutcome> {
    const t1 = tier1Scan(params.text);

    if (t1.matched) {
      // Obvious match → PENDING_REVIEW synchronously, no Tier 2 needed.
      const logId = await this.audit({
        contentType: params.contentType,
        contentRefId: params.contentRefId,
        submittingUserId: params.submittingUserId,
        tier1Match: true,
        flaggedSpan: t1.span,
        resolution: 'PENDING_REVIEW',
        modelVersion: 'tier1-deterministic-v1',
      });
      this.realtime.emitModerationFlag({
        logId,
        contentType: params.contentType,
        tier: 'TIER_1',
        span: t1.span,
        userId: params.submittingUserId,
      });
      return { status: 'PENDING_REVIEW', tier1Match: true, reasons: t1.reasons, span: t1.span };
    }

    // Tier 1 clean → optimistically OPEN, run Tier 2 async (don't block caller).
    setTimeout(() => {
      this.runTier2(params).catch((err) =>
        this.logger.warn(`tier2 failed for ${params.contentRefId}: ${err.message}`),
      );
    });
    return { status: 'OPEN', tier1Match: false, reasons: [] };
  }

  /** Async semantic pass + threshold routing + optional retraction. */
  private async runTier2(params: {
    text: string;
    contentType: ContentType;
    contentRefId: string;
    submittingUserId: string;
    context?: string[];
  }): Promise<void> {
    const result = await this.gemini.classify(params.text, params.context ?? []);

    if (!result || result.label === 'LEGITIMATE' || result.confidence < REVIEW_THRESHOLD) {
      await this.audit({
        contentType: params.contentType,
        contentRefId: params.contentRefId,
        submittingUserId: params.submittingUserId,
        tier1Match: false,
        resolution: 'AUTO_PASSED',
        tier2Confidence: result?.confidence,
        tier2Label: result?.label,
        modelVersion: result?.modelVersion ?? 'tier2-skipped',
      });
      return;
    }

    const retract = result.confidence >= RETRACT_THRESHOLD;
    if (retract) await this.retractContent(params.contentType, params.contentRefId);

    const logId = await this.audit({
      contentType: params.contentType,
      contentRefId: params.contentRefId,
      submittingUserId: params.submittingUserId,
      tier1Match: false,
      resolution: 'PENDING_REVIEW',
      flaggedSpan: result.span ?? undefined,
      sanitizedAltText: result.sanitizedAlt ?? undefined,
      tier2Confidence: result.confidence,
      tier2Label: result.label,
      modelVersion: result.modelVersion,
    });

    // Track repeat violations (PRD §2.B.4).
    await this.recordViolation(params.submittingUserId, logId);

    this.realtime.emitModerationFlag({
      logId,
      contentType: params.contentType,
      tier: 'TIER_2',
      label: result.label,
      confidence: result.confidence,
      retracted: retract,
      span: result.span,
      userId: params.submittingUserId,
    });
  }

  /** Flip an optimistically-shown record back to PENDING_REVIEW at the query layer. */
  private async retractContent(type: ContentType, refId: string): Promise<void> {
    const db = this.db;
    if (!db) return;
    const { table, idCol } = CONTENT_TABLE[type];
    const { error } = await db.from(table).update({ status: 'PENDING_REVIEW' }).eq(idCol, refId);
    if (error) this.logger.warn(`retract ${table}:${refId} failed: ${error.message}`);
  }

  private async recordViolation(userId: string, auditLogId?: string): Promise<void> {
    const db = this.db;
    if (!db) return;
    await db.from('user_violations').insert({ user_id: userId, audit_log_id: auditLogId });
  }

  /** Admin queue: content currently held for review (PRD §2.B.3/§2.B.4). */
  async pendingQueue() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('ai_audit_logs')
      .select('*')
      .eq('resolution', 'PENDING_REVIEW')
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data;
  }

  /** Admin approves the (possibly edited) sanitized text → publish (PRD §2.B.4). */
  async approveSanitized(logId: string, sanitizedText: string, adminId: string) {
    const db = requireDb(this.db);
    const { data: log, error: e1 } = await db
      .from('ai_audit_logs')
      .update({
        resolution: 'ADMIN_APPROVED_SANITIZED',
        sanitized_alt_text: sanitizedText,
        resolved_by_admin_id: adminId,
      })
      .eq('log_id', logId)
      .select('content_type, content_ref_id')
      .single();
    if (e1) throw new Error(e1.message);

    // Republish the cleaned content (PENDING_REVIEW → OPEN) with the sanitized text.
    const meta = CONTENT_TABLE[log.content_type as ContentType];
    if (meta) {
      const patch: Record<string, unknown> = { status: 'OPEN' };
      if (log.content_type === 'JOB_DESC') patch.description = sanitizedText;
      if (log.content_type === 'QA_THREAD') patch.body = sanitizedText;
      if (log.content_type === 'CHAT_MSG') patch.body = sanitizedText;
      await db.from(meta.table).update(patch).eq(meta.idCol, log.content_ref_id);
    }
    return { logId, resolution: 'ADMIN_APPROVED_SANITIZED' as const };
  }

  /** Admin rejects: content stays hidden. */
  async reject(logId: string, adminId: string) {
    const db = requireDb(this.db);
    const { error } = await db
      .from('ai_audit_logs')
      .update({ resolution: 'ADMIN_REJECTED', resolved_by_admin_id: adminId })
      .eq('log_id', logId);
    if (error) throw new Error(error.message);
    return { logId, resolution: 'ADMIN_REJECTED' as const };
  }

  private async audit(row: {
    contentType: ContentType;
    contentRefId: string;
    submittingUserId: string;
    tier1Match: boolean;
    flaggedSpan?: string;
    sanitizedAltText?: string;
    tier2Confidence?: number;
    tier2Label?: string;
    resolution: 'AUTO_PASSED' | 'PENDING_REVIEW';
    modelVersion: string;
  }): Promise<string | undefined> {
    const db = this.db;
    if (!db) return undefined;
    const { data, error } = await db
      .from('ai_audit_logs')
      .insert({
        content_type: row.contentType,
        content_ref_id: row.contentRefId,
        submitting_user_id: row.submittingUserId,
        tier1_match: row.tier1Match,
        tier2_confidence: row.tier2Confidence,
        tier2_label: row.tier2Label,
        flagged_span: row.flaggedSpan,
        sanitized_alt_text: row.sanitizedAltText,
        resolution: row.resolution,
        model_version: row.modelVersion,
      })
      .select('log_id')
      .single();
    if (error) {
      this.logger.error(`audit log write failed: ${error.message}`);
      return undefined;
    }
    return data.log_id;
  }
}
