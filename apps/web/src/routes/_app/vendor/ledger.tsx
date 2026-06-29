import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Banknote, Lock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/ledger")({
  head: () => ({ meta: [{ title: "Capital Ledger — FixIt Vendor" }] }),
  component: Ledger,
});

const transactions = [
  { id: "t1", label: "Job #4821 · AC repair · Al Khuwair",      status: "Released",       amount: 28.0 },
  { id: "t2", label: "Job #4799 · Sink leak · Qurum",           status: "Warranty held",  amount: 30.0 },
  { id: "t3", label: "Job #4756 · Painting · Bowsher",          status: "Released",       amount: 72.0 },
  { id: "t4", label: "Job #4720 · Drywall · Mawaleh",           status: "Warranty held",  amount: 22.0 },
];

function Ledger() {
  const locked = transactions.filter((t) => t.status === "Warranty held").reduce((s, t) => s + t.amount, 0);
  const available = transactions.filter((t) => t.status === "Released").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Vendor treasury"
        title="Capital reserves ledger"
        subtitle="Track warranty-locked escrow pools and your clear withdrawal balance."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <BalanceCard
          icon={Lock}
          label="Locked Warranty Escrow Pools"
          value={locked}
          desc="Frozen until active warranty windows expire."
          tone="navy"
        />
        <BalanceCard
          icon={Banknote}
          label="Available Cash Balance"
          value={available}
          desc="Clear for immediate bank withdrawal in Oman."
          tone="emerald"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white shadow-[var(--shadow-soft)]">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="text-base font-black text-[var(--navy)]">Recent settlements</h3>
          <button className="inline-flex items-center gap-2 rounded-xl bg-[var(--azure)] px-4 py-2 text-xs font-bold text-white hover:bg-[var(--navy)]">
            Request Bi-Weekly Batch Payout <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <ul className="divide-y divide-border">
          {transactions.map((t) => (
            <li key={t.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-4 py-3 text-sm">
              <span className="truncate font-semibold text-[var(--navy)]">{t.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                t.status === "Released" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>{t.status}</span>
              <span className="w-24 text-right font-black text-[var(--navy)] tabular-nums">{t.amount.toFixed(2)} OMR</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BalanceCard({ icon: Icon, label, value, desc, tone }: any) {
  const bg = tone === "emerald" ? "bg-emerald-50" : "bg-[var(--offwhite)]";
  const fg = tone === "emerald" ? "text-emerald-700" : "text-[var(--navy)]";
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-soft)]">
      <div className="p-5 text-white" style={{ background: "var(--gradient-navy)" }}>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        <div className="mt-2 text-4xl font-black">
          {value.toFixed(2)} <span className="text-lg font-bold text-white/80">OMR</span>
        </div>
      </div>
      <div className={`px-5 py-3 text-xs font-semibold ${bg} ${fg}`}>{desc}</div>
    </div>
  );
}