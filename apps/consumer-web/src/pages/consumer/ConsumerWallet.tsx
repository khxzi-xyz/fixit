import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronLeft, ArrowUpRight, ArrowDownRight, ShieldCheck, Plus, Clock, Info } from "lucide-react";
import { TopUpCard } from "@/components/consumer/TopUpCard";
import { api, type Wallet, type Txn } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { PullToRefresh } from "@/components/PullToRefresh";
import { formatDistanceToNow } from "date-fns";

export default function ConsumerWallet() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [showTopup, setShowTopup] = useState(false);

  const load = useCallback(() => {
    return new Promise<void>((resolve) => {
      import("@/lib/api").then(({ swr }) => {
        swr("wallet", api.wallet, setWallet).catch(() => {});
        swr("wallet_txns", api.walletTxns, setTxns).catch(() => {});
        resolve();
      });
    });
  }, []);
  
  useEffect(() => { load(); }, [load]);

  const totalBalance = wallet ? wallet.balance + wallet.lockedBalance : 0;

  return (
    <ConsumerLayout>
      <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries(); await load(); }}>
      <div className="bg-primary text-primary-foreground border-b border-border text-white px-4 pt-4 pb-6 rounded-b-3xl shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/profile")}><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-extrabold">{t("wallet.myWallet", "My Wallet")}</h1>
        </div>
        
        <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">{t("wallet.totalBalance", "Total Balance")}</p>
        <div className="flex items-baseline gap-2 mb-4">
          <h2 className="text-4xl font-black">{totalBalance.toFixed(3)}</h2>
          <span className="text-lg font-bold text-white/70">OMR</span>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3">
            <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">{t("wallet.available", "Available")}</p>
            <p className="text-base font-black text-white">{(wallet?.balance ?? 0).toFixed(3)}</p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3">
            <div className="flex items-center gap-1 text-[10px] text-white/60 uppercase tracking-widest font-bold">
              <ShieldCheck className="w-3 h-3" /> {t("wallet.escrow", "Escrow")}
            </div>
            <p className="text-base font-black text-white">{(wallet?.lockedBalance ?? 0).toFixed(3)}</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 pb-24 space-y-4">
        <div className="flex gap-3">
          <button 
            onClick={() => setShowTopup(!showTopup)}
            className="flex-1 bg-card border border-border rounded-full p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:bg-slate-900 transition-colors shadow-sm"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-sm">{t("wallet.addFunds", "Add Funds")}</span>
          </button>
          <button 
            onClick={() => navigate("/request-service")}
            className="flex-1 bg-card border border-border rounded-full p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-50 dark:bg-slate-900 transition-colors shadow-sm"
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
          <div className="bg-primary/10 border border-primary/20 rounded-full p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-primary/90 leading-relaxed font-medium">
              You have funds held securely in escrow for active jobs. They will be released to the vendor only when you mark the job as completed.
            </p>
          </div>
        )}

        <div className="pt-2">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold">{t("wallet.transactions", "History")}</h3>
          </div>
          
          <div className="bg-card border border-border rounded-full overflow-hidden shadow-sm">
            {txns.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                <img src="/icons/empty_wallet.png" className="w-24 h-24 opacity-80 mix-blend-multiply dark:mix-blend-screen" alt="Empty Wallet" />
                <p className="text-sm font-bold text-muted-foreground">{t("wallet.noTxns", "No transactions yet")}</p>
              </div>
            ) : (
              txns.map((txn, i) => {
                const isPositive = ["DEPOSIT", "PAYOUT", "REFUND", "VOUCHER_CREDIT", "REWARD"].includes(txn.kind);
                const Icon = isPositive ? ArrowDownRight : ArrowUpRight;
                return (
                  <div key={txn.txn_id}>
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          <Icon className={`w-5 h-5 ${isPositive ? "text-green-500" : "text-red-500"}`} />
                        </div>
                        <div>
                          <p className="font-bold text-sm capitalize">{txn.kind.replace(/_/g, " ").toLowerCase()}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(txn.created_at), { addSuffix: true })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${isPositive ? "text-green-500" : "text-foreground"}`}>
                          {isPositive ? "+" : "-"}{Number(txn.amount).toFixed(3)}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">{txn.status}</p>
                      </div>
                    </div>
                    {i < txns.length - 1 && <div className="border-t border-border" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      </PullToRefresh>
    </ConsumerLayout>
  );
}
