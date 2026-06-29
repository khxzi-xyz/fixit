import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { ProofCamera } from "@/components/ProofCamera";
import { api } from "@/lib/api";
import { Camera, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/verify")({
  head: () => ({ meta: [{ title: "Triple-Verify — FixIt" }] }),
  component: Verify,
});

function Verify() {
  const { vendorPhoto, consumerPhoto, setVendorPhoto, setConsumerPhoto, advanceEscrow, escrowStage, activeJobId } = useApp();
  const [vendorImg, setVendorImg] = useState<string | null>(null);
  const [consumerImg, setConsumerImg] = useState<string | null>(null);
  const bothIn = vendorPhoto && consumerPhoto;

  const onCapture = (who: "vendor" | "consumer") => (m: { at: string; lat: number | null; lng: number | null; url: string }) => {
    if (who === "vendor") { setVendorImg(m.url); setVendorPhoto(true); }
    else { setConsumerImg(m.url); setConsumerPhoto(true); }
    if (activeJobId) api.uploadPhoto(activeJobId, who === "vendor" ? "VENDOR_AFTER" : "CONSUMER_AFTER", m.url).catch(() => undefined);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Module 06 · Completion proof"
        title="Triple-Verify completion"
        subtitle="Vendor After + Consumer After + system match against Before — no he-said-she-said."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <PhotoSlot label="Before (locked)" subtitle="Captured during job posting." color="bg-[var(--offwhite)]" />
        <PhotoSlot label="Vendor 'After' photo" imageUrl={vendorImg} subtitle={vendorImg ? "Captured live · GPS + time stamped." : "Awaiting vendor capture."} color="bg-white">
          <ProofCamera label={vendorImg ? "Recapture" : "Capture vendor After"} folder="vendor-after" onCaptured={onCapture("vendor")} />
        </PhotoSlot>
        <PhotoSlot label="Your 'After' confirmation" imageUrl={consumerImg} subtitle={consumerImg ? "Your live photo · GPS + time stamped." : "Take your own photo to confirm."} color="bg-white">
          <ProofCamera label={consumerImg ? "Recapture" : "Capture my After"} folder="consumer-after" onCaptured={onCapture("consumer")} />
        </PhotoSlot>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--navy)]">
          <ShieldCheck className="h-4 w-4 text-emerald-600" /> Final confirmation
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          "Is the job done?" → YES releases the platform-side rolling payout. NO opens dispute review.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            disabled={!bothIn}
            onClick={advanceEscrow}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-40"
          >
            <CheckCircle2 className="h-4 w-4" /> Yes — job done
          </button>
          <button
            disabled={!bothIn}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700 disabled:opacity-40"
          >
            <XCircle className="h-4 w-4" /> No — open dispute
          </button>
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          Current escrow stage: <b>{escrowStage}</b> / 3 — confirming releases stage progression.
        </div>
      </div>
    </div>
  );
}

function PhotoSlot({ label, subtitle, imageUrl, color, children }: {
  label: string; subtitle: string; imageUrl?: string | null; color: string; children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border ${color} p-4 shadow-[var(--shadow-soft)]`}>
      <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 grid h-32 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-[var(--offwhite)] text-[var(--azure)]">
        {imageUrl ? <img src={imageUrl} alt={label} className="h-full w-full object-cover" /> : <Camera className="h-8 w-8 opacity-50" />}
      </div>
      <p className="mt-2 text-xs text-[var(--navy)]/70">{subtitle}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}