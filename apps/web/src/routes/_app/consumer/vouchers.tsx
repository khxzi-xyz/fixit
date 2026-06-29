import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { Ticket, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/vouchers")({
  head: () => ({ meta: [{ title: "Vouchers — FixIt" }] }),
  component: Vouchers,
});

const samples = ["FIXIT-A1B2", "FIXIT-PR05", "FIXIT-FEE6"];

function Vouchers() {
  const { vouchers, redeemVoucher } = useApp();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <div>
      <PageHeader
        eyebrow="Module 21 · Voucher economy"
        title="Redeem FIXIT-XXXX codes"
        subtitle="One code system handles wallet credit, plan unlocks, and fee discounts."
      />
      <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="FIXIT-XXXX"
            className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--azure)]"
          />
          <button
            onClick={() => { const v = redeemVoucher(code); setMsg(v ? { ok: true, text: `Redeemed: ${v.label}` } : { ok: false, text: "Invalid format. Use FIXIT-XXXX." }); setCode(""); }}
            className="rounded-lg bg-[var(--azure)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--navy)]"
          >
            Redeem
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="text-[11px] text-muted-foreground">Try a sample:</span>
          {samples.map((s) => (
            <button key={s} onClick={() => setCode(s)} className="rounded-full bg-[var(--offwhite)] px-2 py-0.5 text-[11px] font-mono font-bold text-[var(--azure)]">{s}</button>
          ))}
        </div>
        {msg && (
          <div className={`mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {msg.text}
          </div>
        )}
      </div>
      <div className="mt-6">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--azure)]">Redeemed history</div>
        {vouchers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-6 text-center text-xs text-muted-foreground">No vouchers redeemed yet.</div>
        ) : (
          <ul className="space-y-2">
            {vouchers.map((v) => (
              <li key={v.code} className="flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold text-[var(--navy)]"><Ticket className="h-4 w-4 text-[var(--azure)]" /> <span className="font-mono">{v.code}</span></div>
                <div className="text-xs text-emerald-700">{v.label}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}