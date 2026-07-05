import { useCallback, useEffect, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api, type Wallet } from "@/lib/api";

export default function JobPayment() {
  const [, params] = useRoute("/job/:id/payment");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const jobId = params?.id;
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [amountDue, setAmountDue] = useState<number>(0);
  const [topupAmt, setTopupAmt] = useState("20");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) return;
    try { setWallet(await api.wallet()); } catch { /**/ }
    try {
      const bids = await api.jobBids(jobId);
      const selected = bids.find((b: any) => b.status === "SELECTED") ?? bids[0];
      if (selected) setAmountDue(Number(selected.bid_amount));
    } catch { /**/ }
  }, [jobId]);
  useEffect(() => { load(); }, [load]);

  const balance = wallet?.balance ?? 0;
  const shortfall = Math.max(0, amountDue - balance);

  const topup = async () => {
    const n = parseFloat(topupAmt); if (!n) return;
    setBusy(true);
    try { await api.topup(n); await load(); toast({ title: "Wallet topped up" }); }
    catch (e) { toast({ title: "Top up failed", description: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(false); }
  };

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-12 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-extrabold">Escrow Lock</h1>
        <p className="text-white/75 text-sm mt-1">Funds held safely until the job completes and warranty clears.</p>
      </div>

      <div className="px-4 -mt-6 space-y-5 max-w-xl mx-auto">
        <Card className="bg-card border-border shadow-md rounded-2xl">
          <CardContent className="p-5">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-bold">Khidmah Lock</p>
                  <p className="text-sm text-muted-foreground">Labor cost only</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-black text-foreground">{amountDue.toFixed(2)}</h2>
                <span className="text-sm text-muted-foreground font-medium">OMR</span>
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted rounded-xl px-4 py-3 mb-4 text-sm">
              <span className="text-muted-foreground">Wallet balance</span>
              <span className="font-bold">{balance.toFixed(2)} OMR</span>
            </div>

            <div className="bg-muted p-4 rounded-xl mb-5">
              <div className="flex gap-2 items-start text-sm">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-muted-foreground"><strong className="text-foreground">Parts not included.</strong> You approve and pay for parts separately in-app once the pro evaluates the issue.</p>
              </div>
            </div>

            {shortfall > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-bold text-destructive">Top up {shortfall.toFixed(2)} OMR more to fund this escrow.</p>
                <div className="flex gap-2">
                  <Input value={topupAmt} onChange={(e) => setTopupAmt(e.target.value.replace(/[^\d.]/g, ""))} className="h-12 w-28 rounded-xl bg-muted" inputMode="decimal" />
                  <Button onClick={topup} disabled={busy} className="flex-1 h-12 rounded-xl font-bold">{busy ? "Adding…" : "Top Up Wallet"}</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => navigate(`/order/${jobId}`)} className="w-full h-14 rounded-xl text-lg font-bold">
                <ShieldCheck className="w-5 h-5 mr-2" /> Funds Locked -Track Order <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </ConsumerLayout>
  );
}
