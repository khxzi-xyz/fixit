import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Send, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/bid")({
  head: () => ({ meta: [{ title: "Submit Bid — FixIt Vendor" }] }),
  component: BidComposer,
});

function BidComposer() {
  const navigate = useNavigate();
  const [labor, setLabor] = useState(28);
  const [warranty, setWarranty] = useState(45);

  return (
    <div>
      <PageHeader
        eyebrow="Binary valuation engine"
        title="Compose secure blind offer"
        subtitle="Two sliders. Field-optimized. Your identity stays sealed until lock."
      />

      <div
        className="rounded-2xl p-6 text-white shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-navy)" }}
      >
        <div className="grid gap-6 md:grid-cols-2">
          <SliderCard
            label="Labor Quotation (Khidmah)"
            unit="OMR"
            value={labor}
            min={10} max={120} step={1}
            onChange={setLabor}
          />
          <SliderCard
            label="Contract Warranty Term"
            unit="days"
            value={warranty}
            min={7} max={180} step={1}
            onChange={setWarranty}
          />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl bg-white/10 p-4 text-sm">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/60">Your sealed bid</div>
            <div className="text-2xl font-black">{labor.toFixed(2)} OMR</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/60">Warranty</div>
            <div className="text-2xl font-black">{warranty} days</div>
          </div>
        </div>

        <button
          onClick={() => navigate({ to: "/vendor/parts" })}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-black text-[var(--navy)] shadow hover:bg-[var(--offwhite)]"
        >
          <Send className="h-4 w-4" /> Submit Secure Blind Offer to Consumer Feed
        </button>
        <div className="mt-3 inline-flex items-center gap-2 text-[11px] text-white/70">
          <ShieldCheck className="h-3.5 w-3.5" /> Bid is held in escrow logic — no consumer-side contact until lock.
        </div>
      </div>
    </div>
  );
}

function SliderCard({
  label, unit, value, min, max, step, onChange,
}: { label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">{label}</span>
        <span className="rounded-md bg-white px-2 py-0.5 text-xs font-black text-[var(--navy)]">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-4 w-full accent-white"
      />
      <div className="mt-1 flex justify-between text-[10px] text-white/50">
        <span>{min} {unit}</span><span>{max} {unit}</span>
      </div>
    </div>
  );
}