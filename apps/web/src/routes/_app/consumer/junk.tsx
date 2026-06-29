import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { Recycle, Truck, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/junk")({
  head: () => ({ meta: [{ title: "Reverse Junk Auctions — FixIt" }] }),
  component: Junk,
});

function Junk() {
  const { listings, placeBid } = useApp();
  const items = listings.filter((l) => l.kind === "junk");
  const [accepted, setAccepted] = useState<string[]>([]);
  const [bidInput, setBidInput] = useState<Record<string, string>>({});

  return (
    <div>
      <PageHeader
        eyebrow="Module 22 · Reverse junk auction"
        title="Buyers compete to pay you"
        subtitle="Post a photo. Local scrap yards & repair shops bid cash. Pickup QR releases funds."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((l) => (
          <div key={l.id} className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-start gap-3">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-emerald-50 text-2xl">{l.emoji}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-black text-[var(--navy)]">{l.title}</div>
                <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <Recycle className="h-3 w-3" /> Pro/Elite buyers notified
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase text-muted-foreground">Top buyer offer</div>
                <div className="text-xl font-black text-emerald-700">{(l.topBid ?? 0).toFixed(2)} OMR</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
              <input
                value={bidInput[l.id] ?? ""}
                onChange={(e) => setBidInput((s) => ({ ...s, [l.id]: e.target.value.replace(/[^0-9.]/g, "") }))}
                placeholder="Buyer offer (demo)"
                className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2 text-sm outline-none focus:border-[var(--azure)]"
              />
              <button
                onClick={() => { const n = Number(bidInput[l.id]); if (n > 0) { placeBid(l.id, n); setBidInput((s) => ({ ...s, [l.id]: "" })); } }}
                className="rounded-lg bg-[var(--navy)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--azure)]"
              >Add offer</button>
              <button
                disabled={accepted.includes(l.id) || !l.topBid}
                onClick={() => setAccepted((a) => [...a, l.id])}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {accepted.includes(l.id) ? <><CheckCircle2 className="inline h-3 w-3" /> Locked</> : <><Truck className="inline h-3 w-3" /> Accept top</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}