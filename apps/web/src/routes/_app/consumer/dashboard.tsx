import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import {
  Wrench, Plug, Hammer, Paintbrush, SprayCan, Cog, Drill,
  Bath, Trees, Truck, Search, Plus, Sparkles, ShieldCheck, Star,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/consumer/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — FixIt Oman" },
      { name: "description", content: "Browse trades, request services, and top up your FixIt wallet." },
    ],
  }),
  component: Dashboard,
});

const categories = [
  { icon: Wrench, label: "Plumbing" },
  { icon: Plug, label: "Electrical" },
  { icon: Cog, label: "AC Repair" },
  { icon: Paintbrush, label: "Painting" },
  { icon: Hammer, label: "Carpentry" },
  { icon: Drill, label: "Drywall" },
  { icon: SprayCan, label: "Cleaning" },
  { icon: Bath, label: "Bathroom" },
  { icon: Trees, label: "Gardening" },
  { icon: Truck, label: "Moving" },
];

function Dashboard() {
  const { walletOMR, topUp } = useApp();
  const [q, setQ] = useState("");

  return (
    <div>
      <PageHeader
        eyebrow="Marhaba 👋"
        title="What needs fixing today?"
        subtitle="Trusted local vendors, escrow-secured, all across Muscat & wider Oman."
      />

      {/* Azure search banner */}
      <div
        className="rounded-3xl p-5 sm:p-8 shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-navy)" }}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60">
              Global discovery
            </div>
            <h2 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
              Tell us the trouble — we'll find the fix.
            </h2>
          </div>
          <div className="hidden rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white sm:block">
            Wallet · {walletOMR.toFixed(2)} OMR
          </div>
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-[var(--shadow-soft)]">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--offwhite)]">
            <Search className="h-5 w-5 text-[var(--azure)]" />
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="What do you need fixed? (e.g., AC Repair, Plumbing, Drywall)"
            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[var(--navy)] outline-none placeholder:text-muted-foreground"
          />
          <Link
            to="/consumer/new-job"
            className="shrink-0 rounded-xl bg-[var(--azure)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--navy)]"
          >
            Post job
          </Link>
        </div>
      </div>

      {/* Wallet promo */}
      <div
        className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-border p-5 lg:grid-cols-[1fr_auto]"
        style={{ background: "var(--gradient-canvas)" }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[var(--azure)]">
            <Sparkles className="h-3.5 w-3.5" /> Liquidity bonus
          </div>
          <h3 className="mt-1 text-xl font-black text-[var(--navy)]">
            Top up 30 OMR — receive 35 OMR in your service pool.
          </h3>
          <p className="mt-1 text-sm text-[var(--navy)]/70">
            Bonus credits unlock instantly. Valid across all trades in Oman.
          </p>
        </div>
        <div className="flex items-end justify-end gap-2">
          <button
            onClick={() => topUp(35)}
            className="rounded-xl bg-[var(--navy)] px-5 py-3 text-sm font-bold text-white shadow hover:bg-[var(--azure)]"
          >
            Top up now
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-8">
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-lg font-black tracking-tight text-[var(--navy)]">Trade categories</h3>
          <span className="text-xs font-semibold text-muted-foreground">Showing local Oman trades</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.label}
                to="/consumer/new-job"
                className="group rounded-2xl border border-border bg-white p-4 text-center shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5 hover:border-[var(--azure)] hover:shadow-[var(--shadow-card)]"
              >
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[var(--offwhite)] text-[var(--azure)] group-hover:bg-[var(--navy)] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="mt-2 text-sm font-semibold text-[var(--navy)]">{c.label}</div>
              </Link>
            );
          })}
        </div>

        <Link
          to="/consumer/new-job"
          className="mt-4 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--azure)]/40 bg-white p-4 hover:border-[var(--azure)]"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--offwhite)] text-[var(--azure)]">
            <Plus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-[var(--navy)]">
              Can't find your trade category?
            </div>
            <div className="truncate text-xs text-muted-foreground">
              Tap here to request a Custom Service Launch — our ops team responds within 24h.
            </div>
          </div>
          <div className="shrink-0 text-xs font-bold text-[var(--azure)]">REQUEST →</div>
        </Link>
      </div>

      {/* Mini activity */}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <StatCard icon={ShieldCheck} label="Active escrow" value="68.00 OMR" tone="emerald" />
        <StatCard icon={Star} label="Avg vendor rating" value="4.81 ★" tone="navy" />
        <StatCard icon={Sparkles} label="Bonus credit" value="+5.00 OMR" tone="azure" />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: any) {
  const color =
    tone === "emerald" ? "text-emerald-600" :
    tone === "azure" ? "text-[var(--azure)]" : "text-[var(--navy)]";
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--offwhite)]">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={`truncate text-lg font-black ${color}`}>{value}</div>
      </div>
    </div>
  );
}