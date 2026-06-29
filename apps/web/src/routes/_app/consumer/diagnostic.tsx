import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { Stethoscope, QrCode, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/consumer/diagnostic")({
  head: () => ({ meta: [{ title: "Diagnostic Pass — FixIt" }] }),
  component: Diag,
});

function Diag() {
  const { diagnosticPassActive, buyDiagnosticPass, releaseDiagnosticPass } = useApp();
  const [log, setLog] = useState<string[]>([]);
  return (
    <div>
      <PageHeader
        eyebrow="Module 18 · Workshop diagnostics"
        title="Rolling 3 OMR Diagnostic Pass"
        subtitle="Pay once. Walk into multiple shops. Only the shop that solves it earns the release."
      />
      <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-[var(--offwhite)] text-[var(--azure)]">
            <Stethoscope className="h-7 w-7" />
          </div>
          <div>
            <div className="text-sm font-black text-[var(--navy)]">Diagnostic Pass · 3 OMR</div>
            <div className="text-xs text-muted-foreground">
              Status: {diagnosticPassActive ? <b className="text-emerald-700">Active — locked in escrow</b> : <span>Inactive</span>}
            </div>
          </div>
          {!diagnosticPassActive ? (
            <button onClick={() => { buyDiagnosticPass(); setLog((l) => ["Pass purchased — 3 OMR locked in escrow.", ...l]); }} className="rounded-xl bg-[var(--azure)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--navy)]">
              Buy pass
            </button>
          ) : (
            <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><QrCode className="inline h-4 w-4" /> Show QR</span>
          )}
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">
        {["Al Khuwair Auto Garage", "Qurum Mobile Repair", "Bowsher Electronics", "Mawaleh Bike Workshop"].map((shop) => (
          <div key={shop} className="rounded-xl border border-border bg-white p-4">
            <div className="text-sm font-bold text-[var(--navy)]">{shop}</div>
            <div className="mt-1 text-xs text-muted-foreground">Visit, get diagnosed, scan QR.</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                disabled={!diagnosticPassActive}
                onClick={() => setLog((l) => [`${shop}: cannot diagnose — pass stays locked.`, ...l])}
                className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-[var(--navy)] disabled:opacity-50"
              >
                Cannot diagnose
              </button>
              <button
                disabled={!diagnosticPassActive}
                onClick={() => { releaseDiagnosticPass(); setLog((l) => [`${shop}: SOLVED — 1 OMR released, 2 OMR rolls into repair quote.`, ...l]); }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Solved — split pass
              </button>
            </div>
          </div>
        ))}
      </div>
      {log.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-white p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Pass ledger</div>
          <ul className="mt-2 space-y-1 text-xs">
            {log.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-[var(--navy)]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" /> {e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}