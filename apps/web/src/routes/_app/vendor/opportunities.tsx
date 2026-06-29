import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { MapPin, Clock, Tag, AlertTriangle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_app/vendor/opportunities")({
  head: () => ({ meta: [{ title: "Opportunities — FixIt Vendor" }] }),
  component: Opps,
});

const jobs = [
  { id: "j1", title: "Split AC not cooling — bedroom unit",      area: "Al Khuwair",      posted: "8 min ago",  tags: ["AC Repair", "Refrigerant"],   budget: "Blind" },
  { id: "j2", title: "Kitchen sink leak under cabinet",          area: "Qurum",           posted: "21 min ago", tags: ["Plumbing", "Same-day"],       budget: "30 OMR fixed" },
  { id: "j3", title: "Repaint hallway + bedroom (2 coats)",      area: "Bowsher",         posted: "1 hr ago",   tags: ["Painting", "2-day"],          budget: "Blind" },
  { id: "j4", title: "Wall socket sparking — urgent",            area: "Al Hail",         posted: "2 hr ago",   tags: ["Electrical", "Urgent"],       budget: "Blind" },
  { id: "j5", title: "Drywall hole patch (3 spots) + finish",    area: "Mawaleh",         posted: "3 hr ago",   tags: ["Drywall"],                    budget: "22 OMR fixed" },
];

function Opps() {
  const navigate = useNavigate();
  const [bid, setBid] = useState("");
  const tooLow = bid !== "" && Number(bid) < 15;

  return (
    <div>
      <PageHeader
        eyebrow="Vendor terminal · Muscat region"
        title="Live opportunities matching your trade"
        subtitle="Filtered to your skill profile and certified service zones."
      />

      <div className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Quick blind bid (OMR)
            </label>
            <input
              value={bid}
              onChange={(e) => setBid(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="e.g. 28"
              className={`mt-1 w-full rounded-lg border bg-[var(--offwhite)] px-3 py-2 text-sm outline-none ${
                tooLow ? "border-red-400" : "border-input focus:border-[var(--azure)]"
              }`}
            />
          </div>
          <button
            onClick={() => navigate({ to: "/vendor/bid" })}
            className="self-end rounded-xl bg-[var(--azure)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--navy)]"
          >
            Open bid composer
          </button>
        </div>
        {tooLow && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
            <AlertTriangle className="h-4 w-4" />
            Bid valuation falls below internal market safety guidelines (15 OMR floor for this trade).
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        {jobs.map((j) => (
          <div key={j.id} className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)] hover:border-[var(--azure)]">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-black text-[var(--navy)] sm:text-base">{j.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {j.area}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {j.posted}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {j.tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full bg-[var(--offwhite)] px-2 py-0.5 text-[10px] font-bold text-[var(--azure)]">
                      <Tag className="h-3 w-3" /> {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Budget</div>
                <div className="text-sm font-black text-[var(--navy)]">{j.budget}</div>
                <button
                  onClick={() => navigate({ to: "/vendor/bid" })}
                  className="mt-2 rounded-lg bg-[var(--navy)] px-3 py-1.5 text-xs font-bold text-white hover:bg-[var(--azure)]"
                >
                  Bid
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}