import { useCallback, useEffect, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronLeft, Clock, ShieldCheck, Check, Loader2 } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function JobBids() {
  const [, params] = useRoute("/job/:id/bids");
  const [, navigate] = useLocation();
  const jobId = params?.id;
  const [bids, setBids] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!jobId) return;
    try { setBids(await api.jobBids(jobId)); } catch { setBids([]); }
    finally { setLoading(false); }
  }, [jobId]);
  
  useEffect(() => { load(); }, [load]);

  const accept = async (bidId: string) => {
    if (!jobId) return;
    setBusy(bidId); setErr(null);
    try {
      await api.selectBid(jobId, bidId);
      navigate(`/order/${jobId}`);
    } catch (e: any) {
      const m = e.message || String(e);
      setErr(m.toLowerCase().includes("top up") ? "Top up your wallet first, then accept." : m);
    } finally { setBusy(null); }
  };

  const labelsOf = (b: any) => (b.proposed_milestones ?? []).map((m: any) => String(m.label)).join(" ");
  const warrantyOf = (b: any) => parseInt(labelsOf(b).match(/(\d+)\s*-?\s*day/i)?.[1] ?? "0", 10);
  const etaOf = (b: any) => parseInt(labelsOf(b).match(/ETA\s*(\d+)/i)?.[1] ?? "0", 10);

  return (
    <ConsumerLayout>
      <div className="sticky top-0 z-40 hero-blue text-white px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/my-jobs")} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <Badge className="bg-white/15 text-white border-0 hover:bg-white/15">JOB #{jobId?.slice(0, 6) ?? ""}</Badge>
        </div>
        <h1 className="text-xl font-extrabold px-1">Review Bids</h1>
        <p className="text-white/80 text-sm px-1 mt-1">{bids.length} blind bid(s) received</p>
      </div>

      <div className="px-4 py-5 pb-24 space-y-4">
        {err && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-bold flex items-start gap-3">
            <span className="shrink-0 mt-0.5 text-lg">⚠️</span>
            <p>{err}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="bg-card border border-border rounded-xl h-48 animate-pulse p-5" />
            ))}
          </div>
        ) : bids.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">No bids yet. Verified vendors in your area have been notified.</p>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid.bid_id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <h3 className="font-bold text-lg">Vendor #{String(bid.vendor_id).slice(0, 6).toUpperCase()}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Blind bid · labor only</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary leading-none">
                        {Number(bid.bid_amount).toFixed(2)} <span className="text-sm">OMR</span>
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-success" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Warranty</p>
                        <p className="font-bold text-sm">{warrantyOf(bid)} Days</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">ETA</p>
                        <p className="font-bold text-sm">{etaOf(bid) ? `${etaOf(bid)} min` : "Soon"}</p>
                      </div>
                    </div>
                  </div>

                  {bid.status === "SELECTED" ? (
                    <div className="w-full bg-success/10 text-success font-bold text-sm py-3 rounded-lg flex items-center justify-center gap-2 border border-success/20">
                      <Check className="w-5 h-5" /> Hired & Escrow Funded
                    </div>
                  ) : (
                    <button 
                      onClick={() => accept(bid.bid_id)} 
                      disabled={!!busy}
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {busy === bid.bid_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                      {busy === bid.bid_id ? "Funding Escrow..." : "Accept & Fund Escrow"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
