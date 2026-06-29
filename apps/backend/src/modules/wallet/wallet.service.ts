import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CLIENT } from '../../supabase/supabase.module';
import { requireDb } from '../../common/db.util';
import { RealtimeGateway } from '../realtime/realtime.gateway';

export type WalletTxnKind =
  | 'TOPUP' | 'TOPUP_BONUS' | 'JOB_FUND_HOLD' | 'JOB_FUND_RELEASE'
  | 'VENDOR_PAYOUT_EARNED' | 'PAYOUT_WITHDRAWAL' | 'PARTS_FUND_HOLD'
  | 'PARTS_FUND_RELEASE' | 'REFUND' | 'VOUCHER_CREDIT' | 'PLATFORM_FEE'
  | 'GOODS_SALE' | 'GOODS_PURCHASE' | 'LEAD_LOCK_FEE' | 'DIAGNOSTIC_PASS'
  | 'ADJUSTMENT';

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** Consumer top-up bonus scale (Module 04): 10→+1, 20→+3, 30..50→+5 ceiling. */
export function topupBonus(amount: number): number {
  if (amount >= 30) return 5;
  if (amount >= 20) return 3;
  if (amount >= 10) return 1;
  return 0;
}

/**
 * The Dual-Wallet system (master_specs Module 04). One wallet per user.
 * Consumers top up (with the bonus scale); vendors accumulate earnings and
 * request payouts on fixed windows. Every balance change is an append-only
 * `wallet_transactions` row; the running balance is cached on `wallets`.
 *
 * This service is the single money primitive — escrow, parts funding, payouts,
 * marketplace, diagnostics all call credit()/debit()/hold()/release() here.
 */
@Injectable()
export class WalletService {
  constructor(
    @Inject(SUPABASE_CLIENT) private readonly db: SupabaseClient | null,
    private readonly realtime: RealtimeGateway,
  ) {}

  /** Get (or lazily create) the user's wallet row. */
  async ensureWallet(userId: string) {
    const db = requireDb(this.db);
    const { data: existing } = await db
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (existing) return existing;

    const ins = await db.from('wallets').insert({ user_id: userId }).select('*').maybeSingle();
    if (ins.data) return ins.data;
    if (ins.error) {
      // eslint-disable-next-line no-console
      console.error('[wallet ensureWallet insert error]', JSON.stringify(ins.error));
      const { data: again } = await db.from('wallets').select('*').eq('user_id', userId).maybeSingle();
      if (again) return again;
      throw new BadRequestException(ins.error.message);
    }
    // Insert returned no representation (no error). Re-read the row we just made.
    const { data: created } = await db.from('wallets').select('*').eq('user_id', userId).maybeSingle();
    if (created) return created;
    throw new BadRequestException('wallet creation failed');
  }

  async getBalance(userId: string) {
    const wallet = await this.ensureWallet(userId);
    return {
      walletId: wallet.wallet_id,
      balance: Number(wallet.balance),
      lockedBalance: Number(wallet.locked_balance),
      currency: wallet.currency,
    };
  }

  async listTransactions(userId: string, limit = 50) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  /**
   * Core ledger write. Applies `amount` (signed) to spendable balance and logs
   * a transaction. Throws if it would drive the balance negative.
   */
  async post(params: {
    userId: string;
    kind: WalletTxnKind;
    amount: number; // signed
    jobId?: string;
    refId?: string;
    externalRef?: string;
    note?: string;
  }) {
    const db = requireDb(this.db);
    const wallet = await this.ensureWallet(params.userId);
    const next = round3(Number(wallet.balance) + params.amount);
    if (next < 0) throw new BadRequestException('insufficient wallet balance');

    const { error: upErr } = await db
      .from('wallets')
      .update({ balance: next })
      .eq('wallet_id', wallet.wallet_id);
    if (upErr) throw new BadRequestException(upErr.message);

    const { data: txn, error: txErr } = await db
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.wallet_id,
        user_id: params.userId,
        kind: params.kind,
        amount: round3(params.amount),
        balance_after: next,
        job_id: params.jobId ?? null,
        ref_id: params.refId ?? null,
        external_ref: params.externalRef ?? null,
        note: params.note ?? null,
      })
      .select('*')
      .single();
    if (txErr) throw new BadRequestException(txErr.message);

    this.realtime.emitWalletUpdate(params.userId, { balance: next, txn });
    return { balance: next, txn };
  }

  /** Move spendable → locked (escrow hold). */
  async hold(params: { userId: string; amount: number; kind: WalletTxnKind; jobId?: string; refId?: string; note?: string }) {
    const db = requireDb(this.db);
    const wallet = await this.ensureWallet(params.userId);
    const amt = round3(params.amount);
    if (Number(wallet.balance) < amt) throw new BadRequestException('insufficient balance to hold');

    const newBalance = round3(Number(wallet.balance) - amt);
    const newLocked = round3(Number(wallet.locked_balance) + amt);
    const { error } = await db
      .from('wallets')
      .update({ balance: newBalance, locked_balance: newLocked })
      .eq('wallet_id', wallet.wallet_id);
    if (error) throw new BadRequestException(error.message);

    await db.from('wallet_transactions').insert({
      wallet_id: wallet.wallet_id,
      user_id: params.userId,
      kind: params.kind,
      amount: -amt,
      balance_after: newBalance,
      job_id: params.jobId ?? null,
      ref_id: params.refId ?? null,
      note: params.note ?? 'funds locked in escrow',
    });

    this.realtime.emitWalletUpdate(params.userId, { balance: newBalance, lockedBalance: newLocked });
    return { balance: newBalance, lockedBalance: newLocked };
  }

  /** Release locked funds: out of locked, optionally crediting a different user. */
  async releaseLocked(params: {
    fromUserId: string;
    amount: number;
    toUserId?: string; // if set, credit this user's spendable balance
    kind: WalletTxnKind;
    jobId?: string;
    note?: string;
  }) {
    const db = requireDb(this.db);
    const wallet = await this.ensureWallet(params.fromUserId);
    const amt = round3(params.amount);
    const newLocked = round3(Math.max(0, Number(wallet.locked_balance) - amt));
    const { error } = await db
      .from('wallets')
      .update({ locked_balance: newLocked })
      .eq('wallet_id', wallet.wallet_id);
    if (error) throw new BadRequestException(error.message);

    if (params.toUserId) {
      await this.post({
        userId: params.toUserId,
        kind: params.kind,
        amount: amt,
        jobId: params.jobId,
        note: params.note ?? 'escrow release',
      });
    }
    this.realtime.emitWalletUpdate(params.fromUserId, { lockedBalance: newLocked });
    return { lockedBalance: newLocked };
  }

  /**
   * Consumer top-up. Applies the bonus scale and writes two ledger rows
   * (principal + bonus). In production the principal is gated behind a verified
   * payment; here we credit immediately for instant/dev rails. Bank/PayPal go
   * through payment_verifications first (see verifyTopup()).
   */
  async topup(userId: string, amount: number, opts?: { externalRef?: string; skipBonus?: boolean }) {
    if (amount <= 0) throw new BadRequestException('top-up amount must be positive');
    const principal = await this.post({
      userId,
      kind: 'TOPUP',
      amount,
      externalRef: opts?.externalRef,
      note: `wallet top-up ${amount} OMR`,
    });
    const bonus = opts?.skipBonus ? 0 : topupBonus(amount);
    if (bonus > 0) {
      await this.post({ userId, kind: 'TOPUP_BONUS', amount: bonus, note: `top-up bonus +${bonus}` });
    }
    const wallet = await this.ensureWallet(userId);
    return { credited: round3(amount + bonus), bonus, balance: Number(wallet.balance) };
  }

  // --- Manual payment verification gate (Module 04 / Loophole 5) -------------

  /** Submit a bank-transfer/PayPal receipt; held until an admin verifies it. */
  async submitVerification(userId: string, input: { amount: number; method: string; receiptUrl?: string; jobId?: string }) {
    const db = requireDb(this.db);
    const wallet = await this.ensureWallet(userId);
    const { data, error } = await db
      .from('payment_verifications')
      .insert({
        user_id: userId,
        wallet_id: wallet.wallet_id,
        job_id: input.jobId ?? null,
        amount: round3(input.amount),
        method: input.method,
        receipt_url: input.receiptUrl ?? null,
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Admin matches the receipt against the real ledger → credit the wallet. */
  async verifyPayment(verificationId: string, adminId: string, approve: boolean, note?: string) {
    const db = requireDb(this.db);
    const { data: v } = await db
      .from('payment_verifications')
      .select('*')
      .eq('verification_id', verificationId)
      .maybeSingle();
    if (!v) throw new NotFoundException('verification not found');
    if (v.status !== 'AWAITING_VERIFICATION') throw new BadRequestException(`already ${v.status}`);

    if (approve) {
      await this.topup(v.user_id, Number(v.amount), { externalRef: `verif:${verificationId}` });
    }
    const { data, error } = await db
      .from('payment_verifications')
      .update({
        status: approve ? 'VERIFIED' : 'REJECTED',
        admin_id: adminId,
        admin_note: note ?? null,
        resolved_at: new Date().toISOString(),
      })
      .eq('verification_id', verificationId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitNotification(v.user_id, {
      kind: approve ? 'PAYMENT_VERIFIED' : 'PAYMENT_REJECTED',
      amount: Number(v.amount),
    });
    return data;
  }

  async pendingVerifications() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('payment_verifications')
      .select('*')
      .eq('status', 'AWAITING_VERIFICATION')
      .order('created_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  // --- Vendor payouts (Module 04) -------------------------------------------

  async requestPayout(vendorId: string, input: { amount: number; bankAccountName?: string; bankAccountRef?: string }) {
    const db = requireDb(this.db);
    const wallet = await this.ensureWallet(vendorId);
    if (Number(wallet.balance) < input.amount) {
      throw new BadRequestException('payout exceeds available balance');
    }
    // Lock the requested amount out of spendable so it can't be double-spent.
    await this.hold({ userId: vendorId, amount: input.amount, kind: 'PAYOUT_WITHDRAWAL', note: 'payout requested' });

    const { data, error } = await db
      .from('payout_requests')
      .insert({
        vendor_id: vendorId,
        wallet_id: wallet.wallet_id,
        amount: round3(input.amount),
        bank_account_name: input.bankAccountName ?? null,
        bank_account_ref: input.bankAccountRef ?? null,
      })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async listPayouts(vendorId: string) {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('payout_requests')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('requested_at', { ascending: false });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  async pendingPayouts() {
    const db = requireDb(this.db);
    const { data, error } = await db
      .from('payout_requests')
      .select('*')
      .eq('status', 'REQUESTED')
      .order('requested_at', { ascending: true });
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  /** Admin settles a payout. PAID removes the locked funds; REJECTED returns them. */
  async resolvePayout(payoutId: string, adminId: string, status: 'PAID' | 'REJECTED', note?: string) {
    const db = requireDb(this.db);
    const { data: p } = await db.from('payout_requests').select('*').eq('payout_id', payoutId).maybeSingle();
    if (!p) throw new NotFoundException('payout not found');
    if (p.status !== 'REQUESTED' && p.status !== 'APPROVED') throw new BadRequestException(`already ${p.status}`);

    if (status === 'PAID') {
      // funds leave the platform: drop from locked, log withdrawal
      await this.releaseLocked({ fromUserId: p.vendor_id, amount: Number(p.amount), kind: 'PAYOUT_WITHDRAWAL', note: 'payout paid out' });
    } else {
      // rejected: return locked → spendable
      const wallet = await this.ensureWallet(p.vendor_id);
      const newLocked = round3(Math.max(0, Number(wallet.locked_balance) - Number(p.amount)));
      const newBalance = round3(Number(wallet.balance) + Number(p.amount));
      await db.from('wallets').update({ balance: newBalance, locked_balance: newLocked }).eq('wallet_id', wallet.wallet_id);
      this.realtime.emitWalletUpdate(p.vendor_id, { balance: newBalance, lockedBalance: newLocked });
    }

    const { data, error } = await db
      .from('payout_requests')
      .update({ status, admin_id: adminId, admin_note: note ?? null, resolved_at: new Date().toISOString() })
      .eq('payout_id', payoutId)
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    this.realtime.emitNotification(p.vendor_id, { kind: `PAYOUT_${status}`, amount: Number(p.amount) });
    return data;
  }
}
