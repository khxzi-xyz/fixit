import { useCallback, useEffect, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ArrowUpRight, ArrowDownRight, ShieldCheck } from "lucide-react";
import { TopUpCard } from "@/components/consumer/TopUpCard";
import { api, type Wallet, type Txn } from "@/lib/api";

export default function ConsumerWallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);

  const load = useCallback(async () => {
    try { const [w, t] = await Promise.all([api.wallet(), api.walletTxns()]); setWallet(w); setTxns(t); }
    catch { /* not authed / table missing */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-12 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-extrabold mb-4">Wallet</h1>
        <p className="text-sm font-medium text-white/70 mb-1">Available Balance</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-5xl font-black">{wallet ? wallet.balance.toFixed(2) : "—"}</h2>
          <span className="text-xl text-white/80 font-medium">OMR</span>
        </div>
        {!!wallet?.lockedBalance && (
          <div className="mt-3 inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-xs">
            <ShieldCheck className="w-4 h-4" /> {wallet.lockedBalance.toFixed(2)} OMR held in escrow
          </div>
        )}
      </div>

      <div className="px-4 -mt-6 space-y-6 pt-0">
        <TopUpCard onCredited={load} />

        <div>
          <h3 className="text-base font-extrabold mb-3">Recent Transactions</h3>
          <div className="space-y-3">
            {txns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet -top up to fund a job.</p>
            ) : txns.map((tx) => {
              const credit = tx.amount >= 0;
              return (
                <div key={tx.txn_id} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${credit ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {credit ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{tx.kind.replace(/_/g, " ").toLowerCase()}</p>
                      {tx.note && <p className="text-xs text-muted-foreground">{tx.note}</p>}
                    </div>
                  </div>
                  <p className={`font-bold ${credit ? "text-success" : ""}`}>{credit ? "+" : ""}{tx.amount.toFixed(2)} OMR</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ConsumerLayout>
  );
}
