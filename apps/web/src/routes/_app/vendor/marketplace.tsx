import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Store, Camera, Tag } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/marketplace")({
  head: () => ({ meta: [{ title: "Sell on FixIt — Vendor" }] }),
  component: Sell,
});

function Sell() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [kind, setKind] = useState<"fixed" | "auction" | "lead-lock">("fixed");
  const [listed, setListed] = useState<{ title: string; price: string; kind: string }[]>([]);

  return (
    <div>
      <PageHeader eyebrow="Modules 19–20 · Open marketplace + Lead-Lock" title="List inventory or a high-ticket item" subtitle="Standard goods use escrow. High-ticket items (cars, heavy equipment) use Lead-Lock with a flat fee." />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
          <div className="text-sm font-bold text-[var(--navy)]">New listing</div>
          <div className="mt-3 grid h-24 place-items-center rounded-xl border-2 border-dashed border-border bg-[var(--offwhite)] text-[var(--azure)]">
            <Camera className="h-7 w-7 opacity-70" />
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Item title"
            className="mt-3 w-full rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2 text-sm outline-none focus:border-[var(--azure)]" />
          <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="Price (OMR)"
            className="mt-2 w-full rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2 text-sm outline-none focus:border-[var(--azure)]" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(["fixed", "auction", "lead-lock"] as const).map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`rounded-lg px-2 py-1.5 text-[11px] font-bold ${kind === k ? "bg-[var(--navy)] text-white" : "bg-[var(--offwhite)] text-[var(--navy)]"}`}>{k}</button>
            ))}
          </div>
          <button
            onClick={() => { if (title && price) { setListed((ls) => [{ title, price, kind }, ...ls]); setTitle(""); setPrice(""); } }}
            className="mt-3 w-full rounded-xl bg-[var(--azure)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--navy)]"
          >
            <Store className="inline h-4 w-4" /> Publish listing
          </button>
          {kind === "lead-lock" && (
            <p className="mt-2 text-[11px] text-muted-foreground">Lead-Lock: flat fee (e.g. 15 OMR vehicles). Money never moves through escrow — buyer pays a small deposit to unlock contact.</p>
          )}
        </div>

        <div>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--azure)]">Your listings</div>
          {listed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-xs text-muted-foreground">Nothing listed yet.</div>
          ) : (
            <ul className="space-y-2">
              {listed.map((l, i) => (
                <li key={i} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
                  <div className="text-sm font-bold text-[var(--navy)]">{l.title}</div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--offwhite)] px-2 py-0.5 text-[10px] font-bold text-[var(--azure)]"><Tag className="h-3 w-3" /> {l.kind}</span>
                    <span className="text-sm font-black text-[var(--navy)]">{l.price} OMR</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}