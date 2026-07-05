import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type Tier2Label =
  | 'LEGITIMATE'
  | 'CONTACT_INFO_LEAKAGE'
  | 'OFF_PLATFORM_REDIRECT_SUGGESTED'
  | 'AMBIGUOUS_NEEDS_REVIEW';

export interface Tier2Result {
  label: Tier2Label;
  confidence: number; // 0..1
  span: string | null; // offending text span
  sanitizedAlt: string | null; // cleaned rewrite for the admin desk
  modelVersion: string;
}

/**
 * Tier-2 semantic disintermediation classifier via Google AI Studio (Gemini).
 * Server-side only -the key never reaches a client (PRD §3.A).
 *
 * Configure: GOOGLE_AI_API_KEY, MODERATION_MODEL (default gemini-2.0-flash).
 * Detects context-dependent evasion that Tier-1 regex misses (PRD §2.B.2).
 */
@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);

  constructor(private readonly config: ConfigService) { }

  get configured(): boolean {
    return Boolean(this.config.get<string>('GOOGLE_AI_API_KEY'));
  }

  private get model(): string {
    return this.config.get<string>('MODERATION_MODEL') ?? 'gemini-2.0-flash';
  }

  private buildPrompt(message: string, context: string[]): string {
    const convo = context.length ? context.map((c) => `- ${c}`).join('\n') : '(none)';
    return [
      'You are a moderation classifier for a service marketplace. The platform earns a',
      'commission only when jobs close ON-platform, so users sometimes try to exchange',
      'contact info or move the deal off-platform to bypass it. Classify the LATEST',
      'message in light of the prior conversation.',
      '',
      'Labels:',
      '- LEGITIMATE: normal service discussion, no bypass intent.',
      '- CONTACT_INFO_LEAKAGE: phone/email/social handle, possibly obfuscated (spelled-out',
      '  digits, spacing, "watsap", etc.).',
      '- OFF_PLATFORM_REDIRECT_SUGGESTED: steering to call/meet/pay outside the app.',
      '- AMBIGUOUS_NEEDS_REVIEW: borderline; a human should decide.',
      '',
      'Prior conversation:',
      convo,
      '',
      `Latest message: """${message}"""`,
      '',
      'Respond with ONLY a JSON object, no markdown, with keys:',
      '{"label": <one label>, "confidence": <0..1 number>, "span": <exact offending substring or null>,',
      ' "sanitized": <the message rewritten with the offending part removed/neutralized, or null>}',
    ].join('\n');
  }

  /** Returns null when not configured (caller treats as Tier-2 skipped). */
  async classify(message: string, context: string[] = []): Promise<Tier2Result | null> {
    const parsed = await this.generateJson<{
      label: Tier2Label;
      confidence: number;
      span: string | null;
      sanitized: string | null;
    }>(this.buildPrompt(message, context), 3000);
    if (!parsed) return null;
    return {
      label: parsed.label,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
      span: parsed.span ?? null,
      sanitizedAlt: parsed.sanitized ?? null,
      modelVersion: `${this.model}`,
    };
  }

  /**
   * AI Rewrite (master_specs Module 01). Turns a rough, possibly-bilingual
   * description ("water leaking fix pls") into a clean technical job ticket a
   * vendor can price. Understands Arabic/Urdu/Hindi/English slang natively and
   * renders the output in the target app language. Never invents facts; if
   * critical info is missing it surfaces clarifying questions.
   */
  async rewriteJobTicket(input: {
    rawText: string;
    categoryHint?: string;
    targetLanguage?: string; // 'en','ar','ur','hi'
  }): Promise<JobTicketRewrite | null> {
    const lang = input.targetLanguage ?? 'en';
    const prompt = [
      'You are a service-marketplace intake assistant. A user described a',
      'physical repair/labor problem in casual language, possibly in Arabic,',
      'Urdu, Hindi, or English slang. Rewrite it into a clear, professional job',
      `ticket a tradesperson can price. Write the ticket in language code "${lang}".`,
      input.categoryHint ? `Likely service category: ${input.categoryHint}.` : '',
      'Do NOT invent specifics the user did not imply. If something critical is',
      'missing (material type, scale, access), list up to 2 short clarifying',
      'questions instead of guessing.',
      '',
      `User's raw description: """${input.rawText}"""`,
      '',
      'Respond with ONLY JSON: {"title": <short title>, "ticket": <clean rewritten',
      'description>, "category_guess": <category id or null>, "clarifying_questions":',
      '[<string>...], "detected_language": <code>}',
    ].filter(Boolean).join('\n');

    const parsed = await this.generateJson<{
      title: string;
      ticket: string;
      category_guess: string | null;
      clarifying_questions: string[];
      detected_language: string;
    }>(prompt, 8000);
    if (!parsed) return null;
    return {
      title: parsed.title,
      ticket: parsed.ticket,
      categoryGuess: parsed.category_guess ?? null,
      clarifyingQuestions: parsed.clarifying_questions ?? [],
      detectedLanguage: parsed.detected_language ?? 'en',
      modelVersion: this.model,
    };
  }

  /**
   * Internal AI price estimator (master_specs Module 01) -admin/system only,
   * NEVER shown to the consumer. Produces a fair market range + a floor used by
   * the bid-floor guard (Module 03) to flag/block sabotage lowball bids.
   */
  async estimatePrice(input: { ticket: string; categoryId?: string }): Promise<PriceEstimate | null> {
    const prompt = [
      'You are an internal pricing model for a hyper-local labor marketplace in',
      'Oman (currency OMR). Estimate a FAIR market labor-only price range for the',
      'job below. Labor only -exclude parts. Be realistic for local rates.',
      input.categoryId ? `Category: ${input.categoryId}.` : '',
      '',
      `Job ticket: """${input.ticket}"""`,
      '',
      'Respond with ONLY JSON: {"min_omr": <number>, "max_omr": <number>,',
      '"floor_omr": <number, the lowest plausible legitimate bid below which a bid',
      'is likely market sabotage>, "rationale": <one sentence>}',
    ].filter(Boolean).join('\n');

    const parsed = await this.generateJson<{
      min_omr: number;
      max_omr: number;
      floor_omr: number;
      rationale: string;
    }>(prompt, 8000);
    if (!parsed) return null;
    return {
      minOmr: Number(parsed.min_omr) || 0,
      maxOmr: Number(parsed.max_omr) || 0,
      floorOmr: Number(parsed.floor_omr) || 0,
      rationale: parsed.rationale ?? '',
      modelVersion: this.model,
    };
  }

  /**
   * AI enrichment for custom services in the Vendor portal.
   * Cleans up custom descriptions into professional titles, tags, and standard categories.
   */
  async enrichCustomService(description: string): Promise<{ title: string; category: string; tags: string[]; professional_description: string; } | null> {
    const prompt = [
      'You are an AI assistant for a professional services marketplace.',
      `A vendor provided the following custom service description: """${description}"""`,
      '',
      'Please analyze this and output a JSON object with:',
      '1. "category": the closest standard category (e.g., "Plumbing", "Electrical", "Cleaning", "Automotive", "Custom").',
      '2. "title": a professional, concise title for this service (max 5 words).',
      '3. "tags": an array of 3-5 keywords for search indexing.',
      '4. "professional_description": A polished, professional rewrite of their description (1-2 sentences).',
      '',
      'Output ONLY valid JSON, no markdown blocks.'
    ].join('\n');

    const parsed = await this.generateJson<{
      title: string;
      category: string;
      tags: string[];
      professional_description: string;
    }>(prompt, 5000);

    return parsed;
  }

  /**
   * Batch-translate short UI/job strings into a target language. Preserves order,
   * keeps numbers/prices/proper-nouns intact, returns null when unconfigured so
   * the caller can fall back to the source text.
   */
  async translateBatch(texts: string[], targetLang: string): Promise<string[] | null> {
    const cleaned = texts.map((t) => (t ?? '').toString());
    if (cleaned.every((t) => !t.trim())) return cleaned;
    const langName: Record<string, string> = { en: 'English', ar: 'Arabic', ur: 'Urdu', hi: 'Hindi', bn: 'Bangla' };
    const prompt = [
      `Translate each string in the JSON array below into ${langName[targetLang] ?? targetLang}.`,
      'Keep numbers, currency amounts (OMR), and proper names unchanged. Keep it natural and concise.',
      'Return ONLY a JSON object: {"items": [<translated strings in the SAME order>]}.',
      '',
      JSON.stringify(cleaned),
    ].join('\n');
    const parsed = await this.generateJson<{ items: string[] }>(prompt, 8000);
    if (!parsed?.items || !Array.isArray(parsed.items) || parsed.items.length !== cleaned.length) return null;
    return parsed.items.map((s, i) => (typeof s === 'string' && s.trim() ? s : cleaned[i]));
  }

  /** Shared one-shot JSON generation with a hard timeout and fail-open null. */
  private async generateJson<T>(prompt: string, timeoutMs: number): Promise<T | null> {
    const apiKey = this.config.get<string>('GOOGLE_AI_API_KEY');
    if (!apiKey) return null;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`;
    try {
      const isBearer = apiKey.startsWith('ya29.') || apiKey.startsWith('AQ.');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (isBearer) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      } else {
        headers['x-goog-api-key'] = apiKey;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        this.logger.warn(`Gemini ${res.status}: ${await res.text()}`);
        return null;
      }
      const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return JSON.parse(text) as T;
    } catch (err) {
      this.logger.warn(`Gemini generateJson failed: ${(err as Error).message}`);
      return null;
    }
  }
}

export interface JobTicketRewrite {
  title: string;
  ticket: string;
  categoryGuess: string | null;
  clarifyingQuestions: string[];
  detectedLanguage: string;
  modelVersion: string;
}

export interface PriceEstimate {
  minOmr: number;
  maxOmr: number;
  floorOmr: number;
  rationale: string;
  modelVersion: string;
}
