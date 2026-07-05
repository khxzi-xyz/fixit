import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { AiProviderService } from '../ai/ai-provider.service';
import { OnboardingService } from './onboarding.service';
import { tableMissing } from '../rewards/rewards.service';

const WELCOME =
  "Hi! 👋 I'm the FixIt Now assistant. Ask me anything about your jobs, payments, refunds or plans — I reply instantly. If you'd rather talk to a human, just tap “Talk to an agent”.";

const AI_FALLBACK =
  "Thanks for your message! I'm having trouble reaching the AI service right now, but a support agent will review your message and get back to you shortly. You can also tap “Talk to an agent” to open a ticket.";

interface ChatMsg {
  msg_id: string;
  sender: 'USER' | 'AI' | 'AGENT';
  content: string;
  created_at: string;
}

/**
 * The permanent "FixIt Support" conversation (Temu/Talabat-style): one thread
 * per user, AI answers instantly, escalation opens a real support_ticket for a
 * human agent. Persists to support_messages (0017); falls back to an
 * in-process store so the chat works before the migration lands.
 */
@Injectable()
export class SupportChatService {
  private readonly logger = new Logger(SupportChatService.name);
  private readonly memory = new Map<string, ChatMsg[]>();

  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly ai: AiProviderService,
    private readonly onboarding: OnboardingService,
  ) {}

  private mem(userId: string): ChatMsg[] {
    if (!this.memory.has(userId)) this.memory.set(userId, []);
    return this.memory.get(userId)!;
  }

  private async store(userId: string, sender: ChatMsg['sender'], content: string): Promise<ChatMsg> {
    if (this.db) {
      const { data, error } = await this.db
        .from('support_messages')
        .insert({ user_id: userId, sender, content })
        .select('*')
        .single();
      if (!error && data) return data as ChatMsg;
      if (error && !tableMissing(error)) this.logger.warn(`support msg store failed: ${error.message}`);
    }
    const msg: ChatMsg = {
      msg_id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sender,
      content,
      created_at: new Date().toISOString(),
    };
    this.mem(userId).push(msg);
    return msg;
  }

  async history(userId: string) {
    let msgs: ChatMsg[] = [];
    if (this.db) {
      const { data, error } = await this.db
        .from('support_messages')
        .select('msg_id, sender, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(200);
      if (!error) msgs = (data ?? []) as ChatMsg[];
      else if (tableMissing(error)) msgs = this.mem(userId);
    } else {
      msgs = this.mem(userId);
    }
    if (msgs.length === 0) {
      const welcome = await this.store(userId, 'AI', WELCOME);
      msgs = [welcome];
    }
    return msgs;
  }

  async send(userId: string, name: string, content: string) {
    const userMsg = await this.store(userId, 'USER', content);

    let replyText = AI_FALLBACK;
    try {
      const history = (await this.history(userId)).slice(-10);
      const context = history
        .map((m) => `${m.sender === 'USER' ? 'Customer' : 'Support'}: ${m.content}`)
        .join('\n');
      replyText = await this.ai.generateSupportReply(
        `Conversation so far:\n${context}\n\nCustomer's latest message: ${content}`,
        { name },
      );
      if (!replyText?.trim()) replyText = AI_FALLBACK;
    } catch (e) {
      this.logger.warn(`AI support reply failed: ${e}`);
    }

    const aiMsg = await this.store(userId, 'AI', replyText.trim());
    return { user: userMsg, reply: aiMsg };
  }

  /** Open a real support ticket from the chat so a human agent follows up. */
  async escalate(userId: string, summary?: string) {
    const recent = (await this.history(userId)).slice(-6);
    const transcript = recent.map((m) => `[${m.sender}] ${m.content}`).join('\n');
    const ticket = await this.onboarding.createTicket(
      userId,
      summary?.trim() || 'Support chat escalation',
      transcript,
    );
    const note = await this.store(
      userId,
      'AGENT',
      `You're in the queue! Ticket #${String(ticket?.ticket_id ?? '').slice(0, 8)} was created — a human agent will reply here and via notifications. Average response time: under 24h.`,
    );
    return { ticket, message: note };
  }
}
