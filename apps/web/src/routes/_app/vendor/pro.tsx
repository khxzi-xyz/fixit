import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { Crown, Check, Radio } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/pro")({
  head: () => ({ meta: [{ title: "FixIt Pro — FixIt Vendor" }] }),
  component: Pro,
});

const perks = [
  "Featured Bids pinned to the top of customer feeds",
  "Unlimited bidding (no daily token cap)",
  "Full digital storefront — bio, photos, portfolio",
  "Blue Tick verification once ID & docs are approved",
  "Receive reviews on every completed job",
];

function Pro() {
  const { isPro, setPro, bidTokens, availableNow, setAvailableNow } = useApp();
  return (
    <div>
      <PageHeader eyebrow="Monetization · Module 09" title="FixIt Pro — 3 OMR / mo" subtitle="Vendor tier. Featured Bids, unlimited bidding, Blue Tick." />

      <div className="rounded-2xl p-6 text-white shadow-[var(--shadow-card)]" style={{ background: "var(--gradient-navy)" }}>
        <div className="flex items-center gap-3">
          <Crown className="h-7 w-7" />
          <div>
            <div className="text-2xl font-black">FixIt Pro</div>
            <div className="text-sm text-white/70">{isPro ? "Active — unlimited bids" : `Free tier · ${bidTokens} bid tokens left`}</div>
          </div>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-white/90"><Check className="mt-0.5 h-4 w-4 text-emerald-300" /> {p}</li>
          ))}
        </ul>
        <button
          onClick={() => setPro(!isPro)}
          className="mt-6 w-full rounded-xl bg-white px-6 py-3 text-sm font-black text-[var(--navy)] hover:bg-[var(--offwhite)]"
        >
          {isPro ? "Cancel subscription" : "Subscribe · 3 OMR / month"}
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <Radio className={`h-6 w-6 ${availableNow ? "text-emerald-600" : "text-muted-foreground"}`} />
          <div>
            <div className="text-sm font-black text-[var(--navy)]">Available Now bat-signal</div>
            <div className="text-xs text-muted-foreground">When ON, you appear on the consumer-facing map as a pulsing marker.</div>
          </div>
        </div>
        <button
          onClick={() => setAvailableNow(!availableNow)}
          className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${availableNow ? "bg-emerald-600" : "bg-[var(--azure)]"}`}
        >
          {availableNow ? "ON · broadcasting" : "Go live"}
        </button>
      </div>
    </div>
  );
}