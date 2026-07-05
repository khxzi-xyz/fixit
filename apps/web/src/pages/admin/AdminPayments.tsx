import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Wallet, ArrowDownToLine, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminPayments() {
  const { toast } = useToast();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"topups" | "payouts">("payouts");

  const load = useCallback(async () => {
    const [v, p] = await Promise.allSettled([
      api.pendingVerifications(),
      api.pendingPayouts(),
    ]);
    if (v.status === "fulfilled") setVerifications(Array.isArray(v.value) ? v.value : []);
    if (p.status === "fulfilled") setPayouts(Array.isArray(p.value) ? p.value : []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const approvePayout = async (payoutId: string, approve: boolean) => {
    setBusy(payoutId);
    try {
      await api.kycReview(payoutId, approve); // reusing generic review endpoint
      toast({ title: approve ? "Payout approved" : "Payout rejected" });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setBusy(null); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payments & Payouts</h1>
            <p className="text-muted-foreground">Approve vendor cashouts and top-up verifications.</p>
          </div>
          <Button variant="outline" size="icon" onClick={load} className="h-9 w-9"><RefreshCw className="w-4 h-4" /></Button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2">
          {([["payouts", "Vendor Payouts", payouts.length], ["topups", "Top-up Verifications", verifications.length]] as const).map(([t, label, count]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-xl font-bold text-sm border transition-all flex items-center gap-2 ${tab === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:bg-muted"}`}>
              {label}
              {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${tab === t ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}`}>{count}</span>}
            </button>
          ))}
        </div>

        {tab === "payouts" && (
          <div className="space-y-4">
            {payouts.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No pending payouts.</p>
              </div>
            ) : payouts.map((p: any) => (
              <Card key={p.payout_id ?? p.id} className="bg-card border-border">
                <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-muted-foreground">{String(p.vendor_id ?? p.user_id ?? "").slice(0, 8)}…</span>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px]">PENDING</Badge>
                    </div>
                    <p className="font-bold text-lg">{Number(p.amount ?? 0).toFixed(3)} OMR</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Requested {p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</p>
                    {p.bank_account && <p className="text-xs text-muted-foreground mt-0.5 font-mono">Bank: {p.bank_account}</p>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => approvePayout(p.payout_id ?? p.id, false)} disabled={!!busy}
                      className="border-destructive text-destructive hover:bg-destructive/10 h-9">
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" onClick={() => approvePayout(p.payout_id ?? p.id, true)} disabled={!!busy}
                      className="bg-green-600 hover:bg-green-700 text-white h-9">
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {tab === "topups" && (
          <div className="space-y-4">
            {verifications.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <ArrowDownToLine className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No pending top-up verifications.</p>
              </div>
            ) : verifications.map((v: any) => (
              <Card key={v.verification_id ?? v.id} className="bg-card border-border">
                <CardContent className="p-5 flex flex-col md:flex-row gap-4">
                  {v.screenshot_url && (
                    <img src={v.screenshot_url} alt="Receipt"
                      className="w-full md:w-40 h-40 object-cover rounded-xl border border-border cursor-pointer"
                      onClick={() => window.open(v.screenshot_url, "_blank")} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-[10px]">PENDING</Badge>
                    </div>
                    <p className="font-bold text-lg">{Number(v.amount ?? 0).toFixed(3)} OMR</p>
                    <p className="text-xs text-muted-foreground mt-0.5">User: {String(v.user_id ?? "").slice(0, 12)}…</p>
                    <p className="text-xs text-muted-foreground">{v.created_at ? new Date(v.created_at).toLocaleString() : ""}</p>
                  </div>
                  <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end">
                    <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10 h-9">
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-9">
                      <Check className="w-4 h-4 mr-1" /> Approve
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
