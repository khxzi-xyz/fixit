import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp, topUpBonus } from "@/context/AppContext";
import { Wallet, ArrowDownToLine, Sparkles, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/wallet")({
  head: () => ({ meta: [{ title: "Wallet & Top-Up — FixIt" }] }),
  component: WalletPage,
});

const tiers = [10, 20, 30, 40, 50];

function WalletPage() {
  const { walletOMR, topUp } = useApp();
  const [last, setLast] = useState<{ credited: number; bonus: number } | null>(null);
  const [custom, setCustom] = useState("");

  return (
    <div>
      <PageHeader
        eyebrow="Dual-wallet · escrow ledger"
        title="Top up your FixIt wallet"
        subtitle="Bonus scales up to a flat +5 OMR ceiling at the 30 OMR tier."
      />

      <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--offwhite)] text-[var(--azure)]">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Available balance</div>
              <div className="text-3xl font-black text-[var(--navy)]">{walletOMR.toFixed(2)} <span className="text-base text-[var(--azure)]">OMR</span></div>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-[var(--navy)] hover:bg-[var(--offwhite)]">
            <ArrowDownToLine className="h-4 w-4" /> Statement
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiers.map((t) => {
          const b = topUpBonus(t);
          return (
            <button
              key={t}
              onClick={() => setLast(topUp(t))}
              className="rounded-2xl border border-border bg-white p-4 text-left shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-[var(--azure)]"
            >
              <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Top up</div>
              <div className="mt-1 text-2xl font-black text-[var(--navy)]">{t} OMR</div>
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <Sparkles className="h-3 w-3" /> +{b} bonus
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">Credited: {t + b} OMR</div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="text-sm font-bold text-[var(--navy)]">Custom amount</div>
        <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="e.g. 25"
            className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2 text-sm outline-none focus:border-[var(--azure)]"
          />
          <button
            onClick={() => { const n = Number(custom); if (n > 0) { setLast(topUp(n)); setCustom(""); } }}
            className="rounded-lg bg-[var(--azure)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--navy)]"
          >
            Top up
          </button>
        </div>
        <div className="mt-2 text-[11px] text-muted-foreground">
          Bonus auto-calculated: 10→+1, 20→+3, 30+→+5 (capped).
        </div>
      </div>

      {last && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          Credited {last.credited.toFixed(2)} OMR (incl. +{last.bonus} bonus). Admin verification simulated.
        </div>
      )}
    </div>
  );
}