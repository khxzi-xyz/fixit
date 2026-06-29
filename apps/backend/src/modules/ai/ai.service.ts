import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { GeminiClient } from '../moderation/gemini.client';

/**
 * AI layer (master_specs Module 01): the bilingual job-ticket rewriter (user
 * facing) and the internal price estimator + bid-floor guard (admin/system
 * only — the number is NEVER returned to consumers).
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly gemini: GeminiClient,
  ) {}

  /** AI Rewrite button. Returns a cleaned ticket + optional clarifying questions. */
  async rewriteTicket(input: { rawText: string; categoryHint?: string; targetLanguage?: string }) {
    if (!input.rawText?.trim()) throw new BadRequestException('rawText is required');
    if (!this.gemini.configured) {
      // Graceful fallback when the key is unset — echo a tidied version.
      return {
        title: input.rawText.slice(0, 60),
        ticket: input.rawText.trim(),
        categoryGuess: input.categoryHint ?? null,
        clarifyingQuestions: [],
        detectedLanguage: input.targetLanguage ?? 'en',
        modelVersion: 'fallback-no-key',
      };
    }
    const result = await this.gemini.rewriteJobTicket(input);
    if (!result) throw new BadRequestException('AI rewrite temporarily unavailable');
    return result;
  }

  /**
   * Compute + persist the internal fair-price estimate for a job. Runs after a
   * job is created. The estimate is stored in job_price_estimates and used by
   * checkBidFloor(); it is never exposed to the consumer.
   */
  async estimateAndStore(jobId: string, ticket: string, categoryId?: string) {
    const db = requireDb(this.db);
    if (!this.gemini.configured) return null;
    const est = await this.gemini.estimatePrice({ ticket, categoryId });
    if (!est) return null;

    const { data, error } = await db
      .from('job_price_estimates')
      .upsert({
        job_id: jobId,
        est_min: est.minOmr,
        est_max: est.maxOmr,
        floor_amount: est.floorOmr,
        model_version: est.modelVersion,
        rationale: est.rationale,
      })
      .select('*')
      .single();
    if (error) {
      this.logger.warn(`price estimate store failed for ${jobId}: ${error.message}`);
      return null;
    }
    return data;
  }

  /**
   * Bid-floor guard (Module 03). Returns whether a bid is below the protected
   * floor for its job. Far-below bids should be blocked; mildly-below flagged.
   */
  async checkBidFloor(jobId: string, bidAmount: number): Promise<{ belowFloor: boolean; block: boolean; floor?: number; reason?: string }> {
    const db = requireDb(this.db);
    const { data: est } = await db
      .from('job_price_estimates')
      .select('floor_amount, est_min')
      .eq('job_id', jobId)
      .maybeSingle();
    if (!est) return { belowFloor: false, block: false };

    const floor = Number(est.floor_amount);
    if (bidAmount >= floor) return { belowFloor: false, block: false, floor };

    // More than 50% below the floor → block as likely market sabotage.
    const block = bidAmount < floor * 0.5;
    return {
      belowFloor: true,
      block,
      floor,
      reason: `bid ${bidAmount} OMR is below the protected floor of ${floor} OMR`,
    };
  }

  /** Admin-only view of the internal estimate. */
  async getEstimate(jobId: string) {
    const db = requireDb(this.db);
    const { data } = await db.from('job_price_estimates').select('*').eq('job_id', jobId).maybeSingle();
    return data ?? null;
  }
}
