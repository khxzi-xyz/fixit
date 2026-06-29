import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { useState } from "react";
import { Camera, Wand2, ImagePlus, Lock, Target, X } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/new-job")({
  head: () => ({ meta: [{ title: "Post a Job — FixIt" }] }),
  component: NewJob,
});

const POLISHED = `**Service Request — Split AC Unit Cooling Failure**

• Symptom: Indoor unit blowing warm air; outdoor compressor cycles every ~3 min.
• Unit: 1.5-ton split AC, ~4 years old, installed in master bedroom.
• Scope requested: Refrigerant pressure diagnostic, condenser coil clean,
  capacitor inspection, and gas top-up if required (R-410A).
• Access: Ground floor villa, Al Khuwair. Available Sat–Thu, 4pm onward.
• Parts/warranty: OEM-equivalent acceptable; min. 30-day labor warranty.`;

function NewJob() {
  const { isPlus, setPlus } = useApp();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&q=70",
  ]);
  const [desc, setDesc] = useState(
    "ac in my bedroom not cold, makes weird click sound, need someone today or tomorrow"
  );
  const [polished, setPolished] = useState(false);
  const [path, setPath] = useState<"blind" | "fixed">("blind");
  const [bounty, setBounty] = useState("35");

  const max = isPlus ? 10 : 3;
  const stockPhotos = [
    "https://images.unsplash.com/photo-1581094271901-8022df4466f9?w=400&q=70",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=70",
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&q=70",
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Step 1 of 3 · New service request"
        title="AI-assisted job builder"
        subtitle="Add photos, describe the issue, and let FixIt format a professional spec."
        actions={
          <button
            onClick={() => setPlus(!isPlus)}
            className="rounded-xl border border-border bg-white px-3 py-2 text-xs font-bold text-[var(--navy)] hover:border-[var(--azure)]"
          >
            {isPlus ? "Plus profile ✓" : "Switch to Plus"}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Left: vault + AI */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-black text-[var(--navy)]">Media vault</h3>
              <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${isPlus ? "bg-emerald-50 text-emerald-700" : "bg-[var(--offwhite)] text-[var(--azure)]"}`}>
                {isPlus ? "Plus" : "Free"} · {photos.length}/{max} images
              </span>
            </div>
            <div
              className="rounded-2xl border-2 border-dashed p-4"
              style={{ borderColor: "color-mix(in oklab, var(--accent) 60%, transparent)", background: "var(--gradient-canvas)" }}
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {photos.map((src, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-border">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {photos.length < max && (
                  <button
                    onClick={() => setPhotos((p) => [...p, stockPhotos[p.length % stockPhotos.length]])}
                    className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-[var(--azure)]/40 bg-white text-[var(--azure)] hover:border-[var(--azure)]"
                  >
                    <div className="text-center">
                      <ImagePlus className="mx-auto h-6 w-6" />
                      <div className="mt-1 text-[11px] font-bold">Attach photo</div>
                    </div>
                  </button>
                )}
              </div>
              <button className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-[var(--azure)]">
                <Camera className="h-4 w-4" /> Capture from camera
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <h3 className="min-w-0 truncate text-base font-black text-[var(--navy)]">
                Describe the issue in your own words
              </h3>
              <button
                onClick={() => { setDesc(POLISHED); setPolished(true); }}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white shadow-lg ring-2 ring-white"
                style={{ background: "var(--gradient-navy)", boxShadow: "0 0 0 4px rgb(19 64 116 / 0.18)" }}
                aria-label="AI transform"
                title="AI: format as professional spec"
              >
                <Wand2 className="h-5 w-5" />
              </button>
            </div>
            <textarea
              value={desc}
              onChange={(e) => { setDesc(e.target.value); setPolished(false); }}
              rows={9}
              className="w-full resize-none rounded-xl border border-input bg-[var(--offwhite)] p-3 text-sm font-medium text-[var(--navy)] outline-none focus:border-[var(--azure)]"
            />
            <div className="mt-2 text-[11px] font-semibold text-muted-foreground">
              {polished
                ? "✨ AI rewrote your description into a clean technical spec — vendors will quote faster."
                : "Tip: Tap the magic wand to transform rough text into a professional spec."}
            </div>
          </section>
        </div>

        {/* Right: bidding deck */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-card)]">
            <h3 className="text-base font-black text-[var(--navy)]">Bidding model</h3>
            <p className="mt-1 text-xs text-muted-foreground">Pick how vendors will respond to your job.</p>

            <div className="mt-4 space-y-3">
              <PathCard
                selected={path === "blind"}
                onClick={() => setPath("blind")}
                icon={Lock}
                title="Standard Blind Auction Feed"
                desc="Vendor names & contact hidden. Receive sealed bids — anti-collusion default."
              />
              <PathCard
                selected={path === "fixed"}
                onClick={() => setPath("fixed")}
                icon={Target}
                title="Fixed Bounty Settlement Contract"
                desc="You set the price. First qualified vendor accepts and locks the contract."
              >
                {path === "fixed" && (
                  <div className="mt-3">
                    <label className="text-[11px] font-bold uppercase tracking-wide text-[var(--navy)]">
                      Target escrow commitment (OMR)
                    </label>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-input bg-[var(--offwhite)] px-3 py-2">
                      <span className="text-sm font-black text-[var(--azure)]">OMR</span>
                      <input
                        value={bounty}
                        onChange={(e) => setBounty(e.target.value.replace(/[^0-9.]/g, ""))}
                        className="w-full bg-transparent text-lg font-black text-[var(--navy)] outline-none"
                      />
                    </div>
                  </div>
                )}
              </PathCard>
            </div>

            <button
              onClick={() => navigate({ to: "/consumer/bids" })}
              className="mt-5 w-full rounded-xl bg-[var(--azure)] py-3 text-sm font-bold text-white shadow hover:bg-[var(--navy)]"
            >
              Broadcast to local vendors →
            </button>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Funds remain in your wallet until you lock a vendor.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PathCard({ selected, onClick, icon: Icon, title, desc, children }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-2xl border-2 p-4 text-left transition ${
        selected
          ? "border-[var(--azure)] bg-[var(--offwhite)] shadow-[var(--shadow-soft)]"
          : "border-border bg-white hover:border-[var(--azure)]/50"
      }`}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${selected ? "bg-[var(--navy)] text-white" : "bg-[var(--offwhite)] text-[var(--azure)]"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-black text-[var(--navy)]">{title}</div>
          <div className="text-xs text-muted-foreground">{desc}</div>
        </div>
        <div className={`grid h-5 w-5 place-items-center rounded-full border-2 ${selected ? "border-[var(--azure)] bg-[var(--azure)]" : "border-border"}`}>
          {selected && <div className="h-2 w-2 rounded-full bg-white" />}
        </div>
      </div>
      {children}
    </button>
  );
}