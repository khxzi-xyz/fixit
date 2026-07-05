import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, User, HardHat, Camera, RefreshCw, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminDisputes() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<any[]>([]);
  const [photos, setPhotos] = useState<Record<string, any[]>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api.disputes();
      const list = Array.isArray(d) ? d : [];
      setDisputes(list);
      // Load photos for each dispute's job
      const photoMap: Record<string, any[]> = {};
      await Promise.allSettled(
        list.map(async (dis: any) => {
          if (dis.job_id) {
            const p = await api.completionPhotos(dis.job_id).catch(() => []);
            if (p.length) photoMap[dis.dispute_id] = p;
          }
        })
      );
      setPhotos(photoMap);
    } catch { setDisputes([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const resolve = async (disputeId: string, decision: "REFUND_CONSUMER" | "RELEASE_VENDOR") => {
    setBusy(disputeId);
    try {
      await api.resolveDispute(disputeId, decision);
      toast({ title: decision === "REFUND_CONSUMER" ? "Refund issued to consumer" : "Funds released to vendor" });
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
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-destructive" /> Dispute Resolution
            </h1>
            <p className="text-muted-foreground mt-1">Review evidence and mediate escrow releases.</p>
          </div>
          <Button variant="outline" size="icon" onClick={load} className="h-9 w-9"><RefreshCw className="w-4 h-4" /></Button>
        </div>

        {disputes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No open disputes.</p>
          </div>
        ) : disputes.map((d: any) => {
          const dispPhotos = photos[d.dispute_id] ?? [];
          const isBusy = busy === d.dispute_id;
          return (
            <Card key={d.dispute_id} className="bg-card border-destructive/30 shadow-[0_0_20px_rgba(239,68,68,0.07)]">
              <CardContent className="p-6">
                <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-destructive uppercase tracking-wider font-mono">{String(d.dispute_id).slice(0, 8)}</span>
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        {d.status ?? "OPEN"}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold">{d.subject ?? d.reason ?? "Dispute"}</h3>
                    <p className="text-sm text-muted-foreground font-medium mt-1">
                      Job: <span className="text-foreground font-mono">{String(d.job_id ?? "").slice(0, 12)}</span>
                      {d.amount && <> · Escrow: <span className="text-foreground">{Number(d.amount).toFixed(3)} OMR</span></>}
                    </p>
                    {d.created_at && <p className="text-xs text-muted-foreground mt-1">{new Date(d.created_at).toLocaleString()}</p>}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-xl flex items-center gap-3 border border-border">
                      <div className="w-9 h-9 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Consumer</p>
                        <p className="font-semibold text-sm">{String(d.consumer_id ?? d.raised_by ?? "").slice(0, 12)}</p>
                      </div>
                    </div>
                    {d.reason && (
                      <p className="text-sm p-3 bg-destructive/5 text-destructive border border-destructive/10 rounded-xl leading-relaxed">
                        "{d.reason}"
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="p-3 bg-muted/50 rounded-xl flex items-center gap-3 border border-border">
                      <div className="w-9 h-9 bg-warning/20 rounded-full flex items-center justify-center shrink-0">
                        <HardHat className="w-4 h-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase">Vendor</p>
                        <p className="font-semibold text-sm">{String(d.vendor_id ?? "").slice(0, 12)}</p>
                      </div>
                    </div>
                    {d.vendor_response && (
                      <p className="text-sm p-3 bg-card border border-border rounded-xl leading-relaxed text-muted-foreground">
                        "{d.vendor_response}"
                      </p>
                    )}
                  </div>
                </div>

                {dispPhotos.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Job Photos</p>
                    <div className="flex flex-wrap gap-3">
                      {dispPhotos.map((ph: any, i: number) => (
                        <div key={i} className="relative">
                          <img src={ph.url ?? ph.photo_url} className="w-32 h-32 object-cover rounded-xl border border-border cursor-pointer hover:opacity-90"
                            onClick={() => window.open(ph.url ?? ph.photo_url, "_blank")} />
                          <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                            {ph.phase}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dispPhotos.length === 0 && (
                  <div className="mb-5 flex gap-3">
                    {["Before", "After"].map((l) => (
                      <div key={l} className="w-32 h-32 bg-muted rounded-xl border border-border flex flex-col items-center justify-center text-muted-foreground">
                        <Camera className="w-5 h-5 mb-1" />
                        <span className="text-xs font-medium">{l}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                  <Button onClick={() => resolve(d.dispute_id, "REFUND_CONSUMER")} disabled={isBusy}
                    className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                    <X className="w-4 h-4 mr-2" /> Refund Consumer
                  </Button>
                  <Button onClick={() => resolve(d.dispute_id, "RELEASE_VENDOR")} disabled={isBusy}
                    className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white font-bold">
                    <Check className="w-4 h-4 mr-2" /> Release to Vendor
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
}
