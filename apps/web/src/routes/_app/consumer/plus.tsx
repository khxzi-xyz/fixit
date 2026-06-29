import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { Crown, Check } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/plus")({
  head: () => ({ meta: [{ title: "FixIt Plus — FixIt" }] }),
  component: Plus,
});

const perks = [
  "Up to 10 images + 5 videos per job (vs 3/1)",
  "20 bilingual AI rewrites / week (vs 5 / month)",
  "Exclusive coupon drops & reduced-price bid windows",
  "Verified Customer badge for faster, better bids",
  "Full Pro storefronts visible (contact stays masked)",
];

function Plus() {
  const { isPlus, setPlus } = useApp();
  return (
    <div>
      <PageHeader eyebrow="Monetization · Module 09" title="FixIt Plus — 3 OMR / mo" subtitle="Consumer perks. Contact information is never sold." />
      <div className="rounded-2xl p-6 text-white shadow-[var(--shadow-card)]" style={{ background: "var(--gradient-navy)" }}>
        <div className="flex items-center gap-3">
          <Crown className="h-7 w-7" />
          <div>
            <div className="text-2xl font-black">FixIt Plus</div>
            <div className="text-sm text-white/70">{isPlus ? "Active — renews monthly" : "Not subscribed"}</div>
          </div>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2 text-sm text-white/90"><Check className="mt-0.5 h-4 w-4 text-emerald-300" /> {p}</li>
          ))}
        </ul>
        <button
          onClick={() => setPlus(!isPlus)}
          className="mt-6 w-full rounded-xl bg-white px-6 py-3 text-sm font-black text-[var(--navy)] hover:bg-[var(--offwhite)]"
        >
          {isPlus ? "Cancel subscription" : "Subscribe · 3 OMR / month"}
        </button>
      </div>
    </div>
  );
}