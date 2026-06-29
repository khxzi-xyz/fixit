import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { MapPin, Gavel, ShoppingBag, QrCode } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/marketplace")({
  head: () => ({ meta: [{ title: "Open Marketplace — FixIt" }] }),
  component: Marketplace,
});

function Marketplace() {
  const { listings, placeBid, spend } = useApp();
  const items = listings.filter((l) => l.kind !== "junk");
  const [bought, setBought] = useState<string[]>([]);
  const [bidInputs, setBidInputs] = useState<Record<string, string>>({});

  return (
    <div>
      <PageHeader
        eyebrow="Module 19 · Open marketplace"
        title="Buy & sell — escrow-locked"
        subtitle="Funds lock instantly. Release on QR handoff. Flat 5% fee on peer-to-peer goods."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((l) => {
          const inBag = bought.includes(l.id);
          return (
            <div key={l.id} className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-start gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--offwhite)] text-2xl">{l.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-black text-[var(--navy)]">{l.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {l.area} · {l.seller}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--offwhite)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--azure)]">
                    {l.kind === "fixed" ? "Buy now" : "Live auction"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase text-muted-foreground">{l.kind === "fixed" ? "Price" : "Top bid"}</div>
                  <div className="text-xl font-black text-[var(--navy)]">{(l.topBid ?? l.price).toFixed(2)} <span className="text-xs text-[var(--azure)]">OMR</span></div>
                </div>
              </div>
              {l.kind === "fixed" ? (
                <button
                  disabled={inBag}
                  onClick={() => { if (spend(l.price)) setBought((b) => [...b, l.id]); }}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--azure)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--navy)] disabled:bg-emerald-600"
                >
                  {inBag ? <><QrCode className="h-4 w-4" /> Locked — scan at handoff</> : <><ShoppingBag className="h-4 w-4" /> Buy now — escrow lock</>}
                </button>
              ) : (
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                  <input
                    value={bidInputs[l.id] ?? ""}
                    onChange={(e) => setBidInputs((s) => ({ ...s, [l.id]: e.target.value.replace(/[^0-9.]/g, "") }))}
                    placeholder={`> ${(l.topBid ?? l.price).toFixed(0)} OMR`}
                    className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2 text-sm outline-none focus:border-[var(--azure)]"
                  />
                  <button
                    onClick={() => { const n = Number(bidInputs[l.id]); if (n > (l.topBid ?? 0)) { placeBid(l.id, n); setBidInputs((s) => ({ ...s, [l.id]: "" })); } }}
                    className="rounded-lg bg-[var(--navy)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--azure)]"
                  >
                    <Gavel className="inline h-4 w-4" /> Bid
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}