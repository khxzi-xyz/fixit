import { Injectable, Inject, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import Groq from 'groq-sdk';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  text: string;
  provider: 'groq';
  model: string;
  tokens?: number;
}

@Injectable()
export class AiProviderService {
  private readonly logger = new Logger(AiProviderService.name);
  private groqClient: Groq;

  private readonly GROQ_KEY = process.env.GROQ_API_KEY ;

  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) {
    const apiKey = this.GROQ_KEY || 'dummy_key_prevent_crash';
    this.groqClient = new Groq({ apiKey });
  }

  /** Get active AI provider from DB settings */
  async getProvider(): Promise<'groq' | 'gemini'> {
    return 'groq';
  }

  /** Set AI provider in DB */
  async setProvider(provider: 'groq' | 'gemini'): Promise<void> {
    if (!this.db) return;
    await this.db
      .from('app_settings')
      .upsert({ key: 'ai_provider', value: provider, updated_at: new Date().toISOString() });
  }

  /** Main generate method */
  async generate(
    messages: AIMessage[],
    options?: { temperature?: number; maxTokens?: number; systemPrompt?: string }
  ): Promise<AIResponse> {
    return this.generateGroq(messages, options);
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

    try {
      const response = await this.groqClient.chat.completions.create({
        model,
        messages: groqMessages as any[],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1024,
      });

      const text = response.choices?.[0]?.message?.content ?? '';
      return { text, provider: 'groq', model, tokens: response.usage?.total_tokens };
    } catch (e: any) {
      this.logger.error(`Groq error: ${e.message}`);
      throw new Error(`Groq API error`);
    }
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
