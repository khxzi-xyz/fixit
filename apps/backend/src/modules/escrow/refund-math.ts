/**
 * Refund / commission math (PRD §1.C.2). All amounts in minor-unit-safe
 * integers (e.g. baisa for OMR, cents for USD) to avoid float drift in money.
 *
 * Two configurable methods:
 *  - METHOD_1 (recommended): commission fixed on the ORIGINAL bid amount.
 *  - METHOD_2 ("goodwill"):  commission taken only from the non-refunded remainder.
 *
 * Every dispute resolution MUST go through this function and be logged -never
 * hand-calculated by an operator (PRD §1.C.2).
 */
export type RefundMethod = 'METHOD_1' | 'METHOD_2';

export interface RefundInput {
  /** Original escrowed bid amount, in minor units (integer). */
  originalAmountMinor: number;
  /** Platform commission rate, 0..1 (e.g. 0.20). */
  commissionRate: number;
  /** Consumer refund fraction of the ORIGINAL amount, 0..1 (e.g. 0.80). */
  refundFraction: number;
  method: RefundMethod;
}

export interface RefundResult {
  consumerRefundMinor: number;
  platformCutMinor: number;
  vendorPayoutMinor: number;
}

export function computeRefund(input: RefundInput): RefundResult {
  const { originalAmountMinor: total, commissionRate, refundFraction, method } = input;

  if (!Number.isInteger(total) || total < 0) throw new Error('originalAmountMinor must be a non-negative integer');
  if (commissionRate < 0 || commissionRate > 1) throw new Error('commissionRate out of range');
  if (refundFraction < 0 || refundFraction > 1) throw new Error('refundFraction out of range');

  const consumerRefund = Math.round(total * refundFraction);
  const remainder = total - consumerRefund;

  let platformCut: number;
  if (method === 'METHOD_1') {
    // Fixed commission on the original amount, but never more than what remains
    // after the consumer refund (can't pay the platform from refunded money).
    platformCut = Math.min(Math.round(total * commissionRate), remainder);
  } else {
    // Commission only on the non-refunded remainder.
    platformCut = Math.round(remainder * commissionRate);
  }

  const vendorPayout = remainder - platformCut;

  // Reconciliation invariant -must always sum to the original escrow balance.
  if (consumerRefund + platformCut + vendorPayout !== total) {
    throw new Error('reconciliation failed: parts do not sum to original amount');
  }

  return {
    consumerRefundMinor: consumerRefund,
    platformCutMinor: platformCut,
    vendorPayoutMinor: vendorPayout,
  };
}
