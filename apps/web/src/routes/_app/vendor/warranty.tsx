import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { ShieldCheck, AlertTriangle, Clock, Ban } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/warranty")({
  head: () => ({ meta: [{ title: "Warranty Claims — FixIt Vendor" }] }),
  component: Warranty,
});

function Warranty() {
  const { warrantyClaims, resolveClaim, strikes, addStrike } = useApp();
  return (
    <div>
      <PageHeader
        eyebrow="Module 07 · Peer-to-peer warranty"
        title="Active warranty claims"
        subtitle="You have 24 hours to schedule a re-fix per claim. Ignored claims become strikes."
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Strikes" value={`${strikes} / 3`} tone="red" icon={AlertTriangle} />
        <Stat label="Response window" value="24 hr" tone="navy" icon={Clock} />
        <Stat label="Ban threshold" value="3 strikes" tone="navy" icon={Ban} />
      </div>

      <div className="mt-6 space-y-3">
        {warrantyClaims.map((c) => (
          <div key={c.id} className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-black text-[var(--navy)]">{c.jobTitle}</div>
                <div className="text-xs text-muted-foreground">Raised {c.raisedAgo} · status: <b className={c.status === "ignored" ? "text-red-700" : c.status === "scheduled" ? "text-emerald-700" : "text-amber-700"}>{c.status}</b></div>
              </div>
              <ShieldCheck className="h-5 w-5 text-[var(--azure)]" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                disabled={c.status !== "open"}
                onClick={() => resolveClaim(c.id, "schedule")}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >Schedule re-fix</button>
              <button
                disabled={c.status !== "open"}
                onClick={() => { resolveClaim(c.id, "ignore"); addStrike(); }}
                className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 disabled:opacity-50"
              >Ignore (adds strike)</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone, icon: Icon }: any) {
  const color = tone === "red" ? "text-red-700" : "text-[var(--navy)]";
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
      <Icon className={`h-4 w-4 ${color}`} />
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-xl font-black ${color}`}>{value}</div>
    </div>
  );
}