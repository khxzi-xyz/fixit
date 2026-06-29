import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { Camera, ShieldCheck, AlertOctagon, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/dispute")({
  head: () => ({ meta: [{ title: "Resolution Center — FixIt" }] }),
  component: Dispute,
});

function Dispute() {
  const [toast, setToast] = useState<{ tone: "ok" | "alert"; text: string } | null>(null);
  const [proof, setProof] = useState(false);

  return (
    <div>
      <PageHeader
        eyebrow="Triple-verify dispute resolution"
        title="Side-by-side completion review"
        subtitle="Compare baseline issue vs. vendor completion evidence before releasing escrow."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          tag="Baseline issue"
          subtitle="Uploaded when job was created"
          img="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900&q=70"
        />
        <Panel
          tag="Vendor completion"
          subtitle="Captured on-site after fix"
          img="https://images.unsplash.com/photo-1581090700227-1e8ce3aa1a45?w=900&q=70"
        />
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-[var(--navy)]">
            Add your own validation photo
          </div>
          <div className="truncate text-xs text-muted-foreground">
            Recommended before releasing funds — speeds up dispute review if needed.
          </div>
        </div>
        <button
          onClick={() => setProof(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--navy)] px-4 py-2.5 text-sm font-bold text-white"
        >
          <Camera className="h-4 w-4" /> Capture photo
        </button>
      </div>

      {proof && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          <ImageIcon className="h-3.5 w-3.5" /> Validation photo attached
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setToast({ tone: "ok", text: "Funds released. 30-day post-job warranty has commenced." })}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--azure)] px-5 py-4 text-sm font-black text-white shadow hover:bg-[var(--navy)]"
        >
          <ShieldCheck className="h-5 w-5" />
          Confirm Quality & Release Escrow Funds
        </button>
        <button
          onClick={() => setToast({ tone: "alert", text: "Dispute protocol initiated. All wallet transfers halted; admins notified." })}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--alert-red,#c0392b)] px-5 py-4 text-sm font-black text-white shadow hover:opacity-90"
          style={{ backgroundColor: "oklch(0.6 0.22 27)" }}
        >
          <AlertOctagon className="h-5 w-5" />
          Initiate Fraud / Dispute Protocol
        </button>
      </div>

      {toast && (
        <div
          className={`mt-5 rounded-xl border p-4 text-sm font-semibold ${
            toast.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

function Panel({ tag, subtitle, img }: { tag: string; subtitle: string; img: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-[var(--navy)]">{tag}</div>
          <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
        <span className="rounded-full bg-[var(--offwhite)] px-2 py-0.5 text-[10px] font-bold text-[var(--azure)]">VERIFIED</span>
      </div>
      <img src={img} alt={tag} className="aspect-[4/3] w-full object-cover" />
    </div>
  );
}