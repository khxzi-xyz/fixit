import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useApp, type Bid } from "@/context/AppContext";
import { Star, ShieldCheck, Eye, EyeOff, Award, Lock } from "lucide-react";

export const Route = createFileRoute("/_app/consumer/bids")({
  head: () => ({ meta: [{ title: "Blind Bids — FixIt" }] }),
  component: Bids,
});

function Bids() {
  const { bids, lockBid } = useApp();
  const navigate = useNavigate();
  const pro = bids.filter((b) => b.pro);
  const std = bids.filter((b) => !b.pro);

  return (
    <div>
      <PageHeader
        eyebrow="Zero-collusion control room"
        title="Incoming blind bids"
        subtitle="Vendor identities are sealed until you lock a contract. Pricing & warranties only."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-2 text-xs font-semibold text-[var(--navy)]">
            <EyeOff className="h-4 w-4 text-[var(--azure)]" /> Identities hidden
          </div>
        }
      />

      <div className="grid gap-3">
        {pro.length > 0 && (
          <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-[var(--azure)]">
            FixIt Pro · Pinned
          </div>
        )}
        {pro.map((b) => <BidCard key={b.id} bid={b} onLock={() => { lockBid(b.id); navigate({ to: "/consumer/escrow" }); }} />)}

        <div className="mt-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Standard bids
        </div>
        {std.map((b) => <BidCard key={b.id} bid={b} onLock={() => { lockBid(b.id); navigate({ to: "/consumer/escrow" }); }} />)}
      </div>
    </div>
  );
}

function BidCard({ bid, onLock }: { bid: Bid; onLock: () => void }) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5 ${
        bid.pro ? "border-2 border-[var(--navy)]" : "border border-border"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {bid.pro && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--navy)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                <Award className="h-3 w-3" /> FixIt Pro Certified
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--offwhite)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--azure)]">
              <EyeOff className="h-3 w-3" /> Sealed identity
            </span>
          </div>
          <div className="mt-2 truncate text-base font-black text-[var(--navy)]">{bid.vendorCode}</div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--navy)]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {bid.rating.toFixed(1)}
            </span>
            <span>· {bid.jobsCompleted} jobs completed</span>
            <span>· {bid.completionRate}% completion</span>
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" /> {bid.warrantyDays}-day warranty
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bid</div>
          <div className="text-2xl font-black text-[var(--navy)]">
            {bid.amount.toFixed(2)} <span className="text-sm font-bold text-[var(--azure)]">OMR</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> Contact revealed after lock
        </div>
        <button
          onClick={onLock}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--azure)] px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-[var(--navy)]"
        >
          <Lock className="h-4 w-4" /> Select & Lock Contractor
        </button>
      </div>
    </div>
  );
}