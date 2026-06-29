import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Hammer, QrCode, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/workshop")({
  head: () => ({ meta: [{ title: "Workshop Intake — FixIt Vendor" }] }),
  component: Workshop,
});

function Workshop() {
  const [quote, setQuote] = useState(40);
  const [stage, setStage] = useState<0|1|2>(0);
  const deposit = +(quote * 0.5).toFixed(2);
  return (
    <div>
      <PageHeader
        eyebrow="Module 18 · Workshop bench"
        title="Customer walks in with the item"
        subtitle="Scan their Diagnostic Pass QR, agree on a price, lock 50% deposit, run rolling payout."
      />

      <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--offwhite)] text-[var(--azure)]"><QrCode className="h-6 w-6" /></div>
          <div>
            <div className="text-sm font-black text-[var(--navy)]">Pass scanned · Customer #D-309</div>
            <div className="text-xs text-muted-foreground">Issue identified: radiator fan failure</div>
          </div>
        </div>

        <div className="mt-5">
          <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Agreed total repair price (OMR)</label>
          <input type="range" min={10} max={300} value={quote} onChange={(e) => setQuote(Number(e.target.value))} className="mt-2 w-full accent-[var(--navy)]" />
          <div className="mt-2 grid grid-cols-3 gap-3 text-center">
            <Box label="Quote" value={`${quote} OMR`} />
            <Box label="50% deposit · escrow" value={`${deposit} OMR`} />
            <Box label="On completion" value={`${(quote - deposit).toFixed(2)} OMR`} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <button disabled={stage !== 0} onClick={() => setStage(1)} className="rounded-xl bg-[var(--azure)] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">1 · Lock 50% deposit</button>
          <button disabled={stage !== 1} onClick={() => setStage(2)} className="rounded-xl bg-[var(--navy)] px-3 py-2 text-xs font-bold text-white disabled:opacity-50">2 · Photo proof submitted</button>
          <button disabled={stage !== 2} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><ShieldCheck className="inline h-3 w-3" /> Rolling payout active</button>
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Hammer className="h-4 w-4 text-[var(--azure)]" /> Remaining 50% releases on Triple-Verify, following the standard rolling warranty schedule.
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--offwhite)] p-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-black text-[var(--navy)]">{value}</div>
    </div>
  );
}