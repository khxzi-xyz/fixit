import { useCallback, useEffect, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ShieldCheck, Check } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { api } from "@/lib/api";

export default function JobBids() {
  const [, params] = useRoute("/job/:id/bids");
  const [, navigate] = useLocation();
  const jobId = params?.id;
  const [bids, setBids] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    try { setBids(await api.jobBids(jobId)); } catch { setBids([]); }
  }, [jobId]);
  useEffect(() => { load(); }, [load]);

  const accept = async (bidId: string) => {
    if (!jobId) return;
    setBusy(bidId); setErr(null);
    try {
      await api.selectBid(jobId, bidId);
      navigate(`/order/${jobId}`);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      setErr(m.toLowerCase().includes("top up") ? "Top up your wallet first, then accept." : m);
    } finally { setBusy(null); }
  };

  const labelsOf = (b: any) => (b.proposed_milestones ?? []).map((m: any) => String(m.label)).join(" ");
  const warrantyOf = (b: any) => parseInt(labelsOf(b).match(/(\d+)\s*-?\s*day/i)?.[1] ?? "0", 10);
  const etaOf = (b: any) => parseInt(labelsOf(b).match(/ETA\s*(\d+)/i)?.[1] ?? "0", 10);

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-md">
        <Badge className="mb-2 bg-white/15 text-white border-0 hover:bg-white/15">JOB #{jobId?.slice(0, 6) ?? ""}</Badge>
        <h1 className="text-xl font-extrabold">Review Bids</h1>
        <p className="text-white/75 text-sm">{bids.length} blind bid(s) -no contact details shared.</p>
      </div>
      <div className="p-4 space-y-4">
        {err && <p className="text-sm font-medium text-destructive">{err}</p>}

        <div className="space-y-4">
          {bids.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bids yet. Verified vendors in your area have been notified.</p>
          ) : bids.map((bid) => (
            <Card key={bid.bid_id} className="bg-card border-border relative overflow-hidden">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Vendor #{String(bid.vendor_id).slice(0, 6).toUpperCase()}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Blind bid · labor only</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{Number(bid.bid_amount).toFixed(2)} <span className="text-sm font-medium">OMR</span></p>
                    <p className="text-[10px] text-muted-foreground uppercase">Khidmah</p>
                  </div>
                </div>

                <div className="flex gap-4 mb-5 p-3 bg-muted/50 rounded-xl">
                  <div className="flex-1 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Warranty</p>
                      <p className="font-semibold text-sm">{warrantyOf(bid)} days</p>
                    </div>
                  </div>
                  <div className="w-px bg-border"></div>
                  <div className="flex-1 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">ETA</p>
                      <p className="font-semibold text-sm">{etaOf(bid) ? `${etaOf(bid)} min` : String(bid.status).toLowerCase()}</p>
                    </div>
                  </div>
                </div>

                {bid.status === "SELECTED" ? (
                  <Badge className="bg-success/10 text-success">Hired · escrow funded</Badge>
                ) : (
                  <Button onClick={() => accept(bid.bid_id)} disabled={!!busy}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-12 shadow-[0_0_15px_rgba(27,110,243,0.3)]">
                    <Check className="w-5 h-5 mr-2" /> {busy === bid.bid_id ? "Funding escrow…" : "Accept & fund escrow"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ConsumerLayout>
  );
}
