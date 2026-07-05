import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronLeft, ArrowUpRight, ArrowDownRight, ShieldCheck, Plus, Clock, Info } from "lucide-react";
import { TopUpCard } from "@/components/consumer/TopUpCard";
import { api, type Wallet, type Txn } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

export default function ConsumerWallet() {
  const [, navigate] = useLocation();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [showTopup, setShowTopup] = useState(false);

  const load = useCallback(async () => {
    try { 
      const [w, t] = await Promise.all([api.wallet(), api.walletTxns()]); 
      setWallet(w); 
      setTxns(t); 
    }
    catch { /* not authed or no db */ }
  }, []);
  
  useEffect(() => { load(); }, [load]);

  const totalBalance = wallet ? wallet.balance + wallet.lockedBalance : 0;

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-4 pb-6 rounded-b-3xl shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/profile")}><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-extrabold">My Wallet</h1>
        </div>
        
        <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">Total Balance</p>
        <div className="flex items-baseline gap-2 mb-4">
          <h2 className="text-4xl font-black">{totalBalance.toFixed(3)}</h2>
          <span className="text-lg font-bold text-white/70">OMR</span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">Available</p>
            <p className="text-base font-black text-white">{(wallet?.balance ?? 0).toFixed(3)}</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3">
            <div className="flex items-center gap-1 text-[10px] text-white/60 uppercase tracking-widest font-bold">
              <ShieldCheck className="w-3 h-3" /> Escrow
            </div>
            <p className="text-base font-black text-white">{(wallet?.lockedBalance ?? 0).toFixed(3)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 pb-24 space-y-4">
        <div className="flex gap-3">
          <button 
            onClick={() => setShowTopup(!showTopup)}
            className="flex-1 bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:bg-slate-900 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-sm">Add Funds</span>
          </button>
          <button 
            onClick={() => navigate("/request-service")}
            className="flex-1 bg-card border border-border rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:bg-slate-900 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-sm">Send Payment</span>
          </button>
        </div>

        {showTopup && (
          <div className="animate-in slide-in-from-top-4 fade-in">
            <TopUpCard onCredited={() => { load(); setShowTopup(false); }} />
          </div>
        )}

        {!!wallet?.lockedBalance && wallet.lockedBalance > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-500/90 leading-relaxed font-medium">
              You have funds held securely in escrow for active jobs. They will be released to the vendor only when you mark the job as completed.
            </p>
          </div>
        )}

        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold">History</h3>
          </div>
          
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            {txns.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                <Clock className="w-10 h-10 text-muted-foreground/50" />
                <p className="text-sm font-bold text-muted-foreground">No transactions yet</p>
              </div>
            ) : txns.map((tx, i) => {
              const credit = tx.amount >= 0;
              return (
                <div key={tx.txn_id} className={`flex items-center justify-between p-4 ${i !== txns.length - 1 ? "border-b border-border" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${credit ? "bg-green-500/15" : "bg-muted"}`}>
                      {credit ? <ArrowDownRight className="w-5 h-5 text-green-500" /> : <ArrowUpRight className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm capitalize">{tx.kind.replace(/_/g, " ").toLowerCase()}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                        </span>
                        {tx.note && (
                          <>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{tx.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className={`font-black text-sm ${credit ? "text-green-500" : "text-foreground"}`}>
                    {credit ? "+" : ""}{tx.amount.toFixed(3)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ConsumerLayout>
  );
}
