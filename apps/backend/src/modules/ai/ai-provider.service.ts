import { Injectable, Inject, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  text: string;
  provider: 'gemini' | 'groq';
  model: string;
  tokens?: number;
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);

  // keys come from .env only — never hardcode (GEMINI_API_KEY falls back to the
  // shared GOOGLE_AI_API_KEY used by GeminiClient)
  private readonly GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
  private readonly GROQ_KEY = process.env.GROQ_API_KEY || '';

  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) { }

  /** Get active AI provider from DB settings */
  async getProvider(): Promise<'gemini' | 'groq'> {
    if (!this.db) return 'groq';
    try {
      const { data } = await this.db
        .from('app_settings')
        .select('value')
        .eq('key', 'ai_provider')
        .single();
      return (data?.value as 'gemini' | 'groq') || 'groq';
    } catch {
      return 'groq'; // default
    }
  }

  /** Set AI provider in DB */
  async setProvider(provider: 'gemini' | 'groq'): Promise<void> {
    if (!this.db) return;
    await this.db
      .from('app_settings')
      .upsert({ key: 'ai_provider', value: provider, updated_at: new Date().toISOString() });
  }

  /** Main generate method -routes to whichever provider is active */
  async generate(
    messages: AIMessage[],
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ): Promise<AIResponse> {
    const provider = await this.getProvider();

    if (provider === 'groq') {
      return this.generateGroq(messages, options);
    } else {
      return this.generateGemini(messages, options);
    }
  }

  /** Quick single prompt shorthand */
  async prompt(text: string, systemPrompt?: string): Promise<string> {
    const messages: AIMessage[] = [{ role: 'user', content: text }];
    if (systemPrompt) messages.unshift({ role: 'system', content: systemPrompt });
    const res = await this.generate(messages);
    return res.text;
  }

  // ── Groq ─────────────────────────────────────────────────────────
  private async generateGroq(
    messages: AIMessage[],
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ): Promise<AIResponse> {
    const model = 'llama-3.3-70b-versatile';

    const groqMessages = options?.systemPrompt
      ? [{ role: 'system', content: options.systemPrompt }, ...messages]
      : messages;

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.GROQ_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: groqMessages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Groq error: ${err}`);
      throw new Error(`Groq API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    return { text, provider: 'groq', model, tokens: data.usage?.total_tokens };
  }

  // ── Gemini ───────────────────────────────────────────────────────
  private async generateGemini(
    messages: AIMessage[],
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ): Promise<AIResponse> {
    const model = 'gemini-1.5-flash';
    const isBearer = this.GEMINI_KEY.startsWith('ya29.') || this.GEMINI_KEY.startsWith('AQ.');

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isBearer) {
      headers['Authorization'] = `Bearer ${this.GEMINI_KEY}`;
    } else {
      headers['x-goog-api-key'] = this.GEMINI_KEY;
    }

    // Convert to Gemini format
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const systemInstruction = options?.systemPrompt ||
      messages.find((m) => m.role === 'system')?.content;

    const body: any = {
      contents,
      generationConfig: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });

    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Gemini error: ${err}`);
      throw new Error(`Gemini API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return { text, provider: 'gemini', model };
  }

  /** Test connectivity to the current provider */
  async testConnection(): Promise<{ ok: boolean; provider: string; latencyMs: number; error?: string }> {
    const start = Date.now();
    const provider = await this.getProvider();
    try {
      const res = await this.prompt('Respond with just: OK');
      return { ok: res.includes('OK') || res.length > 0, provider, latencyMs: Date.now() - start };
    } catch (e: any) {
      return { ok: false, provider, latencyMs: Date.now() - start, error: e.message };
    }
  }

  /** Rewrite a service request ticket in professional language */
  async rewriteTicket(rawText: string, categoryHint?: string): Promise<string> {
    return this.prompt(
      rawText,
      `You are a service request assistant for FixIt Now, a home services marketplace in Oman. 
The user described their service need in raw language. Rewrite it as a clear, professional service request in 1-3 sentences.
${categoryHint ? `Service category: ${categoryHint}` : ''}
Keep it concise, factual, and actionable. Don't add any greetings or signatures.`
    );
  }

  /** Generate WhatsApp support reply */
  async generateSupportReply(userMessage: string, userContext: { name: string; phone?: string; email?: string }): Promise<string> {
    return this.prompt(
      userMessage,
      `You are FixIt Now AI Support Agent. You help customers of FixIt Now, a home services marketplace in Oman (Muscat).
User details: Name: ${userContext.name}${userContext.phone ? `, Phone: ${userContext.phone}` : ''}${userContext.email ? `, Email: ${userContext.email}` : ''}

Respond in a friendly, helpful way. If you cannot resolve the issue, say you're escalating to a human agent.
Keep responses concise (under 150 words). If the user writes in Arabic or Urdu, respond in the same language.`
    );
  }

  /**
   * Use local Ollama instance for AI matchmaker testing
   * Given raw text from user, extracts category, urgency, and formats description.
   */
  async matchmakerLocalOllama(rawText: string) {
    const prompt = `You are an AI assistant for a home services app called FixIt Now.
Given the following user issue, you must extract:
1. "categoryId": ONE of [ELECTRICIAN, PLUMBER, MECHANIC, AC_REPAIR, CARPENTER, PAINTER, CLEANER, TAXI, PHONE_REPAIR, PEST_CONTROL, DELIVERY]
2. "urgency": ONE of [LOW, NORMAL, HIGH, EMERGENCY]
3. "description": A clear, professional 1-2 sentence description of the job.

Respond strictly with valid JSON. Do not include markdown code blocks or any other text.
Format: {"categoryId": "...", "urgency": "...", "description": "..."}

User Issue: "${rawText}"`;

    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3', // Using llama3 as requested, but can be configured
          prompt,
          stream: false,
          format: 'json',
        }),
      });
      if (!res.ok) throw new Error('Ollama failed to respond');
      const data = await res.json();
      return JSON.parse(data.response);
    } catch (e) {
      this.logger.error(`Ollama Matchmaker failed: ${e}`);
      // Fallback response if Ollama is not running
      return {
        categoryId: 'OTHER',
        urgency: 'NORMAL',
        description: rawText,
      };
    }
  }
}
