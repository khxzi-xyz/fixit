import { useCallback, useEffect, useRef, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, ShieldCheck, CheckCircle2, Camera } from "lucide-react";
import { Link, useRoute, useLocation } from "wouter";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { watermarkImage } from "@/lib/watermark";
import { LiveMap } from "@/components/LiveMap";

export default function OrderTracking() {
  const [, params] = useRoute("/order/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const jobId = params?.id;
  const [job, setJob] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [tracking, setTracking] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [upBusy, setUpBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingPhase = useRef<"BEFORE" | "CONSUMER_AFTER">("CONSUMER_AFTER");
  const pickPhoto = (phase: "BEFORE" | "CONSUMER_AFTER") => { pendingPhase.current = phase; fileRef.current?.click(); };

  const [dest, setDest] = useState<{ lat: number; lng: number } | null>(null);

  const load = useCallback(async () => {
    if (!jobId) return;
    try { setJob(await api.getJob(jobId)); } catch { /**/ }
    try { setPhotos(await api.completionPhotos(jobId)); } catch { /**/ }
    try { setTracking(await api.trackingSession(jobId)); } catch { /**/ }
  }, [jobId]);
  useEffect(() => { load(); }, [load]);

  // Report my location as the destination, then poll the vendor's live position.
  useEffect(() => {
    if (!jobId) return;
    navigator.geolocation?.getCurrentPosition((p) => {
      const d = { lat: p.coords.latitude, lng: p.coords.longitude };
      setDest(d);
      api.trackingDestination(jobId, d.lat, d.lng).catch(() => {});
    }, () => {}, { timeout: 5000 });
    const id = setInterval(() => { api.trackingSession(jobId).then(setTracking).catch(() => {}); }, 5000);
    return () => clearInterval(id);
  }, [jobId]);

  const vendorLoc = tracking?.vendorLocation ?? null;
  const enRoute = tracking?.status === "EN_ROUTE";

  const uploadMine = async (file?: File, phase: "BEFORE" | "CONSUMER_AFTER" = "CONSUMER_AFTER") => {
    if (!jobId || !file) return;
    setUpBusy(true);
    try {
      // Create watermark with coordinates and time
      const dataUrl = await watermarkImage(file);
      const { url } = await api.uploadImage(dataUrl, `jobs/${jobId}`);
      await api.uploadPhoto(jobId, phase, url);
      toast({ title: "Your photo uploaded" });
      await load();
    } catch (e) { toast({ title: "Upload failed", description: e instanceof Error ? e.message : String(e) }); }
    finally { setUpBusy(false); }
  };

  const approve = async () => {
    if (!jobId) return;
    setBusy(true);
    try {
      await api.confirmCompletion(jobId, "YES");
      navigate(`/order/${jobId}/review`);
    } catch (e) {
      toast({ title: "Couldn't approve", description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  };

  const status = tracking?.status ?? job?.status ?? "ASSIGNED";
  const vendorBefore = photos.find((p) => (p.phase === "BEFORE" || p.phase === "VENDOR_BEFORE") && p.uploaded_by_user_id !== job?.consumer_id);
  const vendorAfter = photos.find((p) => p.phase === "VENDOR_AFTER");
  const consumerBefore = photos.find((p) => (p.phase === "BEFORE" || p.phase === "CONSUMER_BEFORE") && p.uploaded_by_user_id === job?.consumer_id);
  const consumerAfter = photos.find((p) => p.phase === "CONSUMER_AFTER");
  const canApprove = !!vendorAfter;

  return (
    <ConsumerLayout>
      <div className="relative min-h-screen bg-background">
        <div className="absolute inset-0 h-[40vh] bg-muted overflow-hidden">
          {enRoute && (vendorLoc || dest) ? (
            <LiveMap vendor={vendorLoc} destination={dest} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #1B6EF3 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <p className="text-sm text-muted-foreground z-10 bg-background/70 px-3 py-1.5 rounded-full">{enRoute ? "Waiting for vendor location…" : "Live map appears when the vendor is on the way"}</p>
            </div>
          )}
        </div>

        <div className="absolute top-[35vh] inset-x-0 bottom-0 bg-background rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] p-6 overflow-y-auto z-10 pb-24">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6"></div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <Badge className="bg-primary text-primary-foreground mb-2 shadow-[0_0_10px_rgba(27,110,243,0.3)]">{String(status).replace(/_/g, " ")}</Badge>
              <h1 className="text-2xl font-bold tracking-tight">{job?.description?.slice(0, 40) ?? "Your order"}</h1>
              <p className="text-muted-foreground text-sm mt-1">{tracking?.status === "ARRIVED" ? "Vendor has arrived" : "Tracking in progress"}</p>
            </div>
            <div className="w-14 h-14 bg-card border border-border rounded-full flex items-center justify-center overflow-hidden">
              <div className="text-lg font-bold text-primary">{job?.assigned_vendor_id ? String(job.assigned_vendor_id).slice(0, 2).toUpperCase() : "FX"}</div>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <Button className="flex-1 h-12 rounded-xl bg-card border border-border text-foreground hover:bg-muted" variant="outline">
              <Phone className="w-5 h-5 mr-2 text-primary" /> Contact
            </Button>
            <Link href={`/order/${jobId}/warranty`} className="flex-1">
              <Button className="w-full h-12 rounded-xl bg-card border border-border text-foreground hover:bg-muted" variant="outline">
                <ShieldCheck className="w-5 h-5 mr-2 text-success" /> Warranty
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-lg">Parts Protocol</h3>
            <Card className="bg-card border-border rounded-xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Multi-Receipt Log</h4>
                    <p className="text-xs text-muted-foreground">Vendor uploads receipts for approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="font-bold text-lg">Verification Photos (4-Way)</h3>
            <div className="grid grid-cols-2 gap-4">
              {([
                { label: "Vendor Before", p: vendorBefore, phase: undefined },
                { label: "Vendor After", p: vendorAfter, phase: undefined },
                { label: "Consumer Before", p: consumerBefore, phase: "BEFORE" as const },
                { label: "Consumer After", p: consumerAfter, phase: "CONSUMER_AFTER" as const }
              ]).map(({ label, p, phase }) => (
                <div key={label} className="aspect-square bg-muted rounded-xl border border-dashed border-border flex flex-col items-center justify-center overflow-hidden relative">
                  {p?.url ? (
                    <img src={p.url} alt={label} className="w-full h-full object-cover" />
                  ) : phase ? (
                    <button onClick={() => pickPhoto(phase)} disabled={upBusy} className="flex flex-col items-center justify-center w-full h-full hover:bg-muted/80">
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-xs font-medium text-center px-2">Upload {label}</span>
                    </button>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <span className="text-xs font-medium text-muted-foreground/50">{label} (Pending)</span>
                    </>
                  )}
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMine(file, pendingPhase.current);
            }} />

            <Button onClick={approve} disabled={busy || !canApprove}
              className="w-full h-14 rounded-xl text-lg font-bold bg-success hover:bg-success/90 text-success-foreground mt-2">
              {busy ? "Approving…" : canApprove ? "Approve Completion" : "Waiting for vendor's after-photo"}
            </Button>
          </div>
        </div>
      </div>
    </ConsumerLayout>
  );
}
