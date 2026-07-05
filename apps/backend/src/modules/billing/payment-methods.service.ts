import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { tableMissing } from '../rewards/rewards.service';

export interface AddCardInput {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  holderName?: string;
  cvv?: string; // accepted from the form but never stored
}

/**
 * Saved cards for one-tap payments and the invited free trial. Only metadata
 * (brand/last4/expiry) is persisted — never the PAN or CVV. Falls back to an
 * in-process store until migration 0017 is applied, so flows stay testable.
 */
@Injectable()
export class PaymentMethodsService {
  private readonly logger = new Logger(PaymentMethodsService.name);
  /** dev fallback when the payment_methods table is missing */
  private readonly memory = new Map<string, any[]>();

  constructor(@Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null) {}

  private brandOf(pan: string): string {
    if (/^4/.test(pan)) return 'VISA';
    if (/^5[1-5]/.test(pan) || /^2[2-7]/.test(pan)) return 'MASTERCARD';
    if (/^3[47]/.test(pan)) return 'AMEX';
    return 'CARD';
  }

  private luhnOk(pan: string): boolean {
    let sum = 0;
    let dbl = false;
    for (let i = pan.length - 1; i >= 0; i--) {
      let d = pan.charCodeAt(i) - 48;
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
      dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  async add(userId: string, input: AddCardInput) {
    const pan = (input.cardNumber || '').replace(/\D/g, '');
    if (pan.length < 12 || pan.length > 19 || !this.luhnOk(pan)) {
      throw new BadRequestException('Invalid card number');
    }
    const year = input.expYear < 100 ? 2000 + input.expYear : input.expYear;
    const expiry = new Date(year, input.expMonth, 1); // first day AFTER the expiry month
    if (!(input.expMonth >= 1 && input.expMonth <= 12) || expiry.getTime() < Date.now()) {
      throw new BadRequestException('Card is expired or the expiry date is invalid');
    }

    const row = {
      user_id: userId,
      brand: this.brandOf(pan),
      last4: pan.slice(-4),
      exp_month: input.expMonth,
      exp_year: year,
      holder_name: input.holderName ?? null,
      token: `sandbox_${Math.random().toString(36).slice(2, 10)}`,
      is_default: (await this.list(userId)).length === 0,
    };

    if (this.db) {
      const { data, error } = await this.db.from('payment_methods').insert(row).select('*').single();
      if (!error) return data;
      if (!tableMissing(error)) throw new BadRequestException(error.message);
      this.logger.warn('payment_methods table missing (0017) — using in-memory store');
    }
    const pm = { pm_id: `mem-${Date.now()}`, created_at: new Date().toISOString(), ...row };
    this.memory.set(userId, [...(this.memory.get(userId) ?? []), pm]);
    return pm;
  }

  async list(userId: string) {
    if (this.db) {
      const { data, error } = await this.db
        .from('payment_methods')
        .select('pm_id, brand, last4, exp_month, exp_year, holder_name, is_default, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error) return data ?? [];
      if (!tableMissing(error)) throw new BadRequestException(error.message);
    }
    return this.memory.get(userId) ?? [];
  }

  async remove(userId: string, pmId: string) {
    if (this.db && !pmId.startsWith('mem-')) {
      const { error } = await this.db.from('payment_methods').delete().eq('pm_id', pmId).eq('user_id', userId);
      if (error && !tableMissing(error)) throw new BadRequestException(error.message);
      return { deleted: true };
    }
    this.memory.set(userId, (this.memory.get(userId) ?? []).filter((p) => p.pm_id !== pmId));
    return { deleted: true };
  }

  async hasAny(userId: string) {
    return (await this.list(userId)).length > 0;
  }
}
