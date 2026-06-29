import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { Receipt, Plus, Camera, CheckCircle2, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/parts")({
  head: () => ({ meta: [{ title: "Parts Logger — FixIt Vendor" }] }),
  component: Parts,
});

type Mode = "multi" | "escort" | "none";

function Parts() {
  const { receipts, addReceipt, approveParts, partsApproved } = useApp();
  const [mode, setMode] = useState<Mode>("multi");
  const [store, setStore] = useState("");
  const [amount, setAmount] = useState("");
  const total = receipts.reduce((s, r) => s + r.amount, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Module 05 · On-site parts protocol"
        title="Pick a protocol — log on site"
        subtitle="Bidding covers labor (Khidmah) only. Parts are sorted live on location."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <ProtocolCard active={mode === "multi"}  onClick={() => setMode("multi")}  icon={Receipt} title="A · Multi-Receipt" desc="Vendor buys, logs each receipt." />
        <ProtocolCard active={mode === "escort"} onClick={() => setMode("escort")} icon={Users}   title="B · Escort Mode"   desc="Consumer pays the shop directly." />
        <ProtocolCard active={mode === "none"}   onClick={() => setMode("none")}   icon={Zap}     title="C · No Parts"      desc="Labor-only, skip to verify." />
      </div>

      {mode === "multi" && (
        <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_auto]">
            <input value={store} onChange={(e) => setStore(e.target.value)} placeholder="Store / supplier name"
              className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2 text-sm outline-none focus:border-[var(--azure)]" />
            <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="OMR"
              className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2 text-sm outline-none focus:border-[var(--azure)]" />
            <button
              onClick={() => { if (store && Number(amount) > 0) { addReceipt(store, Number(amount)); setStore(""); setAmount(""); } }}
              className="inline-flex items-center justify-center gap-1 rounded-lg bg-[var(--azure)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--navy)]"
            >
              <Plus className="h-4 w-4" /> Log receipt
            </button>
          </div>

          <ul className="mt-4 divide-y divide-border">
            {receipts.length === 0 && <li className="py-3 text-xs text-muted-foreground">No receipts yet. Snap one with the in-app camera for each shop.</li>}
            {receipts.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2 text-[var(--navy)]"><Camera className="h-4 w-4 text-[var(--azure)]" /> <b>{r.store}</b></div>
                <div className="font-bold text-[var(--navy)]">{r.amount.toFixed(2)} OMR</div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--offwhite)] px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Master bill total</div>
            <div className="text-xl font-black text-[var(--navy)]">{total.toFixed(2)} OMR</div>
          </div>

          <button
            disabled={total === 0 || partsApproved}
            onClick={approveParts}
            className="mt-3 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {partsApproved ? <><CheckCircle2 className="inline h-4 w-4" /> Consumer approved parts bill</> : "Push to consumer for approval"}
          </button>
        </div>
      )}

      {mode === "escort" && (
        <div className="mt-6 rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-[var(--navy)]">
            The consumer toggled <b>"I'll buy parts myself."</b> Inspect on site, write a shopping list, and walk with them to the shop. <b>No parts money touches the app.</b>
          </p>
          <button className="mt-3 rounded-lg bg-[var(--azure)] px-4 py-2 text-sm font-bold text-white">Mark escort complete</button>
        </div>
      )}
      {mode === "none" && (
        <div className="mt-6 rounded-2xl border border-border bg-white p-5">
          <p className="text-sm text-[var(--navy)]">No parts needed. Proceed straight to Triple-Verify under the original Khidmah quote.</p>
        </div>
      )}
    </div>
  );
}

function ProtocolCard({ active, onClick, icon: Icon, title, desc }: any) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border-2 p-4 text-left transition ${active ? "border-[var(--navy)] bg-white shadow-[var(--shadow-card)]" : "border-border bg-white hover:border-[var(--azure)]"}`}
    >
      <Icon className="h-5 w-5 text-[var(--azure)]" />
      <div className="mt-2 text-sm font-black text-[var(--navy)]">{title}</div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </button>
  );
}