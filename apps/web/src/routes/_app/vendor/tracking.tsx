import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MapPin, Camera, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/tracking")({
  head: () => ({ meta: [{ title: "On-Site Route — FixIt Vendor" }] }),
  component: VendorRoute,
});

type Item = { id: string; label: string; amount: number };

function VendorRoute() {
  const [omw, setOmw] = useState(true);
  const [items, setItems] = useState<Item[]>([
    { id: "i1", label: "R-410A refrigerant top-up (500g)", amount: 8.4 },
    { id: "i2", label: "Capacitor 35µF + wiring kit",     amount: 4.2 },
  ]);
  const [label, setLabel] = useState("");
  const [amt, setAmt] = useState("");

  return (
    <div>
      <PageHeader
        eyebrow="Live job · Al Khuwair"
        title="On-site route & inventory"
        subtitle="Toggle dispatch, capture receipts, and bundle into the customer invoice."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Map / OMW */}
        <section className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-soft)]">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border p-4">
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-[var(--navy)]">Dispatch tracker</h3>
              <p className="truncate text-xs text-muted-foreground">Background GPS sharing with the customer.</p>
            </div>
            <button
              onClick={() => setOmw((v) => !v)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider transition ${
                omw ? "bg-[var(--azure)] text-white" : "bg-[var(--offwhite)] text-[var(--navy)]"
              }`}
            >
              {omw ? "On My Way · LIVE" : "Tap to start"}
            </button>
          </div>
          <div className="relative h-64 w-full" style={{
            backgroundImage:
              "linear-gradient(rgba(19,64,116,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(19,64,116,0.08) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            backgroundColor: "#EEF4F8",
          }}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 260" preserveAspectRatio="none">
              <path d="M20,230 C100,200 180,80 380,40" stroke="#134074" strokeWidth="3" fill="none" strokeDasharray="6 6" />
            </svg>
            {omw && (
              <div className="absolute" style={{ left: "45%", top: "45%", transform: "translate(-50%,-50%)" }}>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--navy)] text-white shadow-lg ring-4 ring-white">
                  <MapPin className="h-4 w-4" />
                </div>
              </div>
            )}
            <div className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-[var(--navy)] shadow">
              {omw ? "ETA · 12 min" : "Idle"}
            </div>
          </div>
        </section>

        {/* Receipts */}
        <section className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[var(--navy)]">On-site inventory log</h3>
            <button className="inline-flex items-center gap-1 rounded-lg border border-border bg-[var(--offwhite)] px-3 py-1.5 text-xs font-bold text-[var(--navy)]">
              <Camera className="h-3.5 w-3.5" /> Scan receipt
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {items.map((it) => (
              <li key={it.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl border border-border bg-[var(--offwhite)] px-3 py-2.5">
                <span className="truncate text-sm font-semibold text-[var(--navy)]">{it.label}</span>
                <span className="text-sm font-black text-[var(--azure)]">{it.amount.toFixed(2)} OMR</span>
                <button onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}
                        className="grid h-7 w-7 place-items-center rounded text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-2">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Part / material" className="rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none" />
            <input value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="OMR" className="w-24 rounded-lg border border-input bg-white px-3 py-2 text-sm outline-none" />
            <button
              onClick={() => {
                const a = parseFloat(amt);
                if (!label || isNaN(a)) return;
                setItems((xs) => [...xs, { id: Math.random().toString(36).slice(2), label, amount: a }]);
                setLabel(""); setAmt("");
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-[var(--navy)] px-3 py-2 text-xs font-bold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>

          <button className="mt-5 w-full rounded-xl bg-[var(--azure)] py-3 text-sm font-bold text-white hover:bg-[var(--navy)]">
            Bundle into customer invoice
          </button>
        </section>
      </div>
    </div>
  );
}