import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { Clock, ShieldCheck, Truck, MapPin, RotateCw, Check } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/escrow")({
  head: () => ({ meta: [{ title: "Escrow Tracking — FixIt" }] }),
  component: Escrow,
});

function Escrow() {
  const { escrowStage, advanceEscrow, resetEscrow, lockedBidId, bids } = useApp();
  const locked = bids.find((b) => b.id === lockedBidId);

  const steps = [
    { n: 1, title: "Awaiting Bank Verification", desc: "Your top-up is being cleared through the Oman payments rail.", tone: "amber" },
    { n: 2, title: "Capital Safely Locked in Escrow", desc: "Funds frozen — vendor cannot withdraw until job acceptance.", tone: "emerald" },
    { n: 3, title: "Vendor Dispatched", desc: "Live GPS tracking active. ETA updates every 30 seconds.", tone: "azure" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={locked ? `Contract locked with ${locked.vendorCode}` : "Active contract"}
        title="Escrow & dispatch timeline"
        subtitle="Every milestone is bank-verified. Your funds release only on your approval."
        actions={
          <div className="flex gap-2">
            <button onClick={resetEscrow} className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-[var(--navy)]">
              <RotateCw className="mr-1 inline h-3.5 w-3.5" /> Reset
            </button>
            <button onClick={advanceEscrow} className="rounded-xl bg-[var(--azure)] px-3 py-2 text-xs font-bold text-white">
              Advance milestone →
            </button>
          </div>
        }
      />

      <div
        className="grid grid-cols-3 gap-3 rounded-2xl p-4 text-white shadow-[var(--shadow-card)]"
        style={{ background: "var(--gradient-navy)" }}
      >
        <Mini label="Locked amount" value={`${locked ? locked.amount.toFixed(2) : "0.00"} OMR`} />
        <Mini label="Warranty term" value={`${locked?.warrantyDays ?? 0} days`} />
        <Mini label="Stage" value={`${escrowStage} / 3`} />
      </div>

      <div className="relative mt-8 rounded-2xl border border-border bg-white p-6 shadow-[var(--shadow-soft)]">
        <div className="absolute left-9 top-10 bottom-10 w-px bg-border" />
        <ol className="space-y-6">
          {steps.map((s) => {
            const active = escrowStage >= s.n;
            const isCurrent = escrowStage === s.n;
            const Icon = s.n === 1 ? Clock : s.n === 2 ? ShieldCheck : Truck;
            const ring =
              !active ? "bg-[var(--offwhite)] text-muted-foreground ring-border" :
              s.tone === "emerald" ? "bg-emerald-500 text-white ring-emerald-200" :
              s.tone === "azure" ? "bg-[var(--azure)] text-white ring-[var(--azure)]/30" :
              "bg-amber-500 text-white ring-amber-200";
            return (
              <li key={s.n} className="relative grid grid-cols-[auto_1fr] items-start gap-4">
                <div className={`relative z-10 grid h-12 w-12 place-items-center rounded-full ring-4 ${ring}`}>
                  {active && s.n < escrowStage ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div
                  className={`rounded-xl border p-4 ${
                    !active ? "border-border bg-[var(--offwhite)]" :
                    s.tone === "amber" ? "border-amber-200 bg-amber-50" :
                    s.tone === "emerald" ? "border-emerald-200 bg-emerald-50" :
                    "border-[var(--azure)]/30 bg-[var(--offwhite)]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-black text-[var(--navy)]">Milestone {s.n}: {s.title}</h4>
                    {isCurrent && (
                      <span className="rounded-full bg-[var(--navy)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--navy)]/75">{s.desc}</p>

                  {s.n === 3 && escrowStage >= 3 && (
                    <div className="mt-3 overflow-hidden rounded-xl border border-[var(--azure)]/30 bg-white">
                      <div className="relative h-44 w-full" style={{
                        backgroundImage:
                          "linear-gradient(rgba(19,64,116,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(19,64,116,0.08) 1px, transparent 1px)",
                        backgroundSize: "28px 28px",
                        backgroundColor: "#EEF4F8",
                      }}>
                        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 180" preserveAspectRatio="none">
                          <path d="M20,160 C120,140 160,40 380,30" stroke="#134074" strokeWidth="3" fill="none" strokeDasharray="6 6" />
                        </svg>
                        <div className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white shadow">
                          Vendor · Al Khuwair
                        </div>
                        <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-[var(--navy)] shadow">
                          ETA · 12 min
                        </div>
                        <div
                          className="absolute"
                          style={{ left: "42%", top: "38%", transform: "translate(-50%,-50%)" }}
                        >
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--navy)] text-white shadow-lg">
                            <Truck className="h-4 w-4" />
                          </div>
                        </div>
                        <div
                          className="absolute right-4 top-6"
                        >
                          <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--azure)] text-white shadow-lg">
                            <MapPin className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-white/60">{label}</div>
      <div className="mt-1 truncate text-lg font-black text-white">{value}</div>
    </div>
  );
}