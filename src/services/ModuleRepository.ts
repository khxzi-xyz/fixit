import { api } from "../../apps/consumer-web/src/lib/api";

export interface Wallet {
  wallet_id: string;
  user_id: string;
  balance: number;
  locked_balance: number;
  currency: string;
}

export interface WalletTransaction {
  txn_id: string;
  wallet_id: string;
  kind: string;
  amount: number;
  balance_after: number;
  note?: string;
  created_at: string;
}

export class ModuleRepository {
  static async getWallet(): Promise<Wallet> {
    try {
      const data = await api.wallet();
      return {
        wallet_id: data.walletId,
        user_id: data.walletId,
        balance: data.balance,
        locked_balance: data.lockedBalance,
        currency: data.currency,
      };
    } catch (e) {
      console.error("[FixIt Node Failure]: Wallet fetch failed", e);
      throw e;
    }
  }

  static async getTransactions(): Promise<WalletTransaction[]> {
    try {
      const data = await api.walletTxns();
      return data.map((t) => ({
        txn_id: t.txn_id,
        wallet_id: t.txn_id,
        kind: t.kind,
        amount: t.amount,
        balance_after: t.balance_after,
        note: t.note || undefined,
        created_at: t.created_at,
      }));
    } catch (e) {
      console.error("[FixIt Node Failure]: Transactions fetch failed", e);
      throw e;
    }
  }

  static async fundEscrow(amount: number): Promise<{ credited: number; balance: number }> {
    try {
      const res = await api.topup(amount);
      return { credited: res.credited, balance: res.balance };
    } catch (e) {
      console.error("[FixIt Node Failure]: Escrow lock transaction failed", e);
      throw e;
    }
  }
}
