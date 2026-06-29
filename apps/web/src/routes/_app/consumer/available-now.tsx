import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Radio, Send } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/consumer/available-now")({
  head: () => ({ meta: [{ title: "Available Now — FixIt" }] }),
  component: AvailableNow,
});

const nearby = [
  { code: "Vendor #A-204", trade: "Plumbing",   km: 0.6, eta: "8 min" },
  { code: "Vendor #C-118", trade: "AC Repair",  km: 1.2, eta: "12 min" },
  { code: "Vendor #M-77",  trade: "Electrical", km: 2.4, eta: "20 min" },
];

function AvailableNow() {
  const [sent, setSent] = useState<string[]>([]);
  return (
    <div>
      <PageHeader
        eyebrow="Bat-signal · live map"
        title="Vendors available right now"
        subtitle="Pulsing markers appear only when a vendor flips 'Available Now'. Tap one to send a direct Bounty."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[var(--sky)]/30 to-white shadow-[var(--shadow-soft)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(19,64,116,.15),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(19,64,116,.1),transparent_60%)]" />
          {nearby.map((v, i) => (
            <div key={v.code} className="absolute" style={{ top: `${20 + i * 22}%`, left: `${25 + i * 18}%` }}>
              <span className="relative flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-600" />
              </span>
            </div>
          ))}
          <div className="absolute bottom-3 right-3 rounded-lg bg-white/90 px-3 py-1.5 text-[11px] font-bold text-[var(--navy)] shadow">
            <Radio className="inline h-3.5 w-3.5 text-emerald-600" /> 3 vendors live
          </div>
        </div>
        <div className="space-y-3">
          {nearby.map((v) => (
            <div key={v.code} className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-black text-[var(--navy)]">{v.code}</div>
                  <div className="text-xs text-muted-foreground">{v.trade} · {v.km} km · ETA {v.eta}</div>
                </div>
                <button
                  onClick={() => setSent((s) => [...s, v.code])}
                  disabled={sent.includes(v.code)}
                  className="rounded-lg bg-[var(--azure)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--navy)] disabled:bg-emerald-600"
                >
                  {sent.includes(v.code) ? "Bounty sent ✓" : <><Send className="inline h-3 w-3" /> Direct bounty</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}