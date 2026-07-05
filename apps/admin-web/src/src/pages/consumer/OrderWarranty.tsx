import { useCallback, useEffect, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, Check } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function OrderWarranty() {
  const [, params] = useRoute("/order/:id/warranty");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const jobId = params?.id;
  const [warranty, setWarranty] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!jobId) return;
    try { setWarranty(await api.getWarranty(jobId)); } catch { /**/ }
  }, [jobId]);
  useEffect(() => { load(); }, [load]);

  const proposedDays = warranty?.days ?? warranty?.proposed_days ?? 7;
  const agreed = warranty?.status === "AGREED" || !!warranty?.agreed_at;

  const agree = async () => {
    if (!jobId) return;
    setBusy(true);
    try { await api.agreeWarranty(jobId); toast({ title: `Warranty agreed · ${proposedDays} days` }); navigate(`/order/${jobId}`); }
    catch (e) { toast({ title: "Couldn't agree", description: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(false); }
  };

  const counter = async (days: number) => {
    if (!jobId) return;
    setBusy(true);
    try { await api.counterWarranty(jobId, days); toast({ title: `Counter-offer sent · ${days} days` }); await load(); }
    catch (e) { toast({ title: "Couldn't counter", description: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(false); }
  };

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-8 pb-16 rounded-b-3xl shadow-md text-center">
        <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black tracking-tight">Warranty Agreement</h1>
        <p className="text-white/80 text-sm mt-2 max-w-xs mx-auto">Funds stay in escrow until this period ends dispute-free.</p>
      </div>

      <div className="px-4 -mt-8 space-y-5 max-w-xl mx-auto">
        <Card className="bg-card border-border shadow-lg rounded-2xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-6">
              <div>
                <p className="text-sm text-muted-foreground">Pro proposed</p>
                <h2 className="text-2xl font-black mt-1 text-foreground">{proposedDays} Days</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            {agreed ? (
              <div className="text-center py-2">
                <p className="font-bold text-success flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Agreed · {proposedDays} days</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Button onClick={agree} disabled={busy} className="w-full h-14 rounded-xl text-lg font-bold bg-success hover:bg-success/90 text-success-foreground">
                  <Check className="w-5 h-5 mr-2" /> Agree to {proposedDays} Days
                </Button>
                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t border-border" />
                  <span className="mx-4 text-xs text-muted-foreground uppercase font-semibold">Or counter offer</span>
                  <div className="flex-grow border-t border-border" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[14, 30, 60].map((d) => (
                    <Button key={d} onClick={() => counter(d)} disabled={busy} variant="outline" className="h-12 rounded-xl border-border font-semibold">{d} Days</Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center pb-4">
          <Link href={`/order/${jobId}`} className="text-primary font-semibold text-sm">Back to Order Tracking</Link>
        </div>
      </div>
    </ConsumerLayout>
  );
}
