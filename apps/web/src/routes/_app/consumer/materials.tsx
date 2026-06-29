import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { Receipt, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/materials")({
  head: () => ({ meta: [{ title: "Material Costs — FixIt" }] }),
  component: Materials,
});

type Row = { id: string; label: string; vendor: string; amount: number; thumb: string };

const seed: Row[] = [
  { id: "r1", label: "R-410A refrigerant top-up (500g)", vendor: "Lulu Hypermarket · Bowsher", amount: 8.4, thumb: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&q=70" },
  { id: "r2", label: "Capacitor 35µF + wiring kit",      vendor: "Al Maha Electrical",         amount: 4.2, thumb: "https://images.unsplash.com/photo-1581090700227-1e8ce3aa1a45?w=200&q=70" },
  { id: "r3", label: "Coil cleaning solvent (2L)",       vendor: "Carrefour · Qurum",          amount: 3.1, thumb: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200&q=70" },
];

function Materials() {
  const [rows, setRows] = useState<Row[]>(seed);
  const [newLabel, setNewLabel] = useState("");
  const [newAmt, setNewAmt] = useState("");

  const subtotal = rows.reduce((s, r) => s + r.amount, 0);
  const labor = 18;
  const total = subtotal + labor;

  return (
    <div>
      <PageHeader
        eyebrow="Live cost protocol"
        title="Material receipts & itemized totals"
        subtitle="Every part logged by the vendor is photographed and matched to a store receipt."
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: receipts grid */}
        <section className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-black text-[var(--navy)]">Receipt aggregator</h3>
            <span className="text-xs font-semibold text-muted-foreground">{rows.length} receipts</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {rows.map((r) => (
              <div key={r.id} className="overflow-hidden rounded-xl border border-border bg-[var(--offwhite)]">
                <img src={r.thumb} alt="" className="h-28 w-full object-cover" />
                <div className="p-2.5">
                  <div className="line-clamp-2 text-xs font-bold text-[var(--navy)]">{r.label}</div>
                  <div className="mt-0.5 truncate text-[10px] text-muted-foreground">{r.vendor}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-black text-[var(--azure)]">{r.amount.toFixed(2)} OMR</span>
                    <button onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                            className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border-2 border-dashed border-[var(--azure)]/40 p-3">
            <div className="grid grid-cols-[1fr_auto_auto] gap-2">
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                     placeholder="Extra part description"
                     className="rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none" />
              <input value={newAmt} onChange={(e) => setNewAmt(e.target.value.replace(/[^0-9.]/g, ""))}
                     placeholder="OMR" className="w-24 rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none" />
              <button
                onClick={() => {
                  const amt = parseFloat(newAmt);
                  if (!newLabel || isNaN(amt)) return;
                  setRows((rs) => [...rs, {
                    id: Math.random().toString(36).slice(2),
                    label: newLabel, vendor: "Vendor added · pending receipt",
                    amount: amt, thumb: "https://images.unsplash.com/photo-1554224154-22dec7ec8818?w=200&q=70",
                  }]);
                  setNewLabel(""); setNewAmt("");
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-[var(--navy)] px-3 py-2 text-xs font-bold text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            </div>
          </div>
        </section>

        {/* Right: totals */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-white shadow-[var(--shadow-card)]">
            <div className="rounded-t-2xl p-5 text-white" style={{ background: "var(--gradient-navy)" }}>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-white/70">
                <Receipt className="h-3.5 w-3.5" /> Itemized invoice
              </div>
              <div className="mt-1 text-3xl font-black">{total.toFixed(2)} <span className="text-base font-bold text-white/80">OMR</span></div>
              <div className="mt-1 text-xs text-white/70">Includes parts, labor & escrow protection.</div>
            </div>
            <div className="space-y-3 p-5 text-sm">
              <Row label="Parts subtotal" value={subtotal} />
              <Row label="Labor (quoted)" value={labor} />
              <div className="border-t border-border pt-3">
                <Row bold label="Total to release" value={total} />
              </div>
            </div>
            <div className="p-5 pt-0">
              <button className="w-full rounded-xl bg-[var(--azure)] py-3.5 text-sm font-black text-white shadow hover:bg-[var(--navy)]">
                Approve Total Parts Charge & Authorize Escrow Release
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-muted-foreground ${bold ? "text-[var(--navy)] font-black" : "font-medium"}`}>{label}</span>
      <span className={`tabular-nums ${bold ? "text-lg font-black text-[var(--navy)]" : "font-semibold text-[var(--navy)]"}`}>{value.toFixed(2)} OMR</span>
    </div>
  );
}