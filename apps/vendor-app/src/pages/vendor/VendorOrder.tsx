import { useCallback, useEffect, useRef, useState } from "react";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation, Phone, MapPin, Camera, CheckCircle2 } from "lucide-react";
import { useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { watermarkImage } from "@/lib/watermark";
import { LiveMap } from "@/components/LiveMap";
import { Capacitor } from "@capacitor/core";

type Phase = "BEFORE" | "VENDOR_AFTER" | "CONSUMER_BEFORE" | "CONSUMER_AFTER";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

/** Trigger haptic feedback safely (no-op on web) */
async function haptic(style: "light" | "medium" | "heavy") {
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch { /* no-op on web */ }
}

export default function VendorOrder() {
  const [, params] = useRoute("/vendor/order/:id");
  const { toast } = useToast();
  const jobId = params?.id;
  const [job, setJob] = useState<any>(null);
  const [status, setStatus] = useState<string>("ASSIGNED");
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [dest, setDest] = useState<{ lat: number; lng: number } | null>(null);

  // Native geo watch ID (string for Capacitor, number for browser fallback)
  const geoWatchId = useRef<string | number | null>(null);
  const fileRefs = { BEFORE: useRef<HTMLInputElement>(null), VENDOR_AFTER: useRef<HTMLInputElement>(null) };

  const load = useCallback(async () => {
    if (!jobId) return;
    try {
      const j = await api.getJob(jobId);
      setJob(j);
      try { const s = await api.trackingSession(jobId); if (s?.status) setStatus(s.status); if (s?.destination) setDest(s.destination); } catch { /**/ }
      const ps = await api.completionPhotos(jobId);
      const map: Record<string, string> = {};
      ps.forEach((p: any) => {
        if (p.phase === "BEFORE" && p.uploaded_by_user_id === j?.consumer_id) {
          map["CONSUMER_BEFORE"] = p.url;
        } else if (p.phase === "BEFORE" || p.phase === "VENDOR_BEFORE") {
          map["BEFORE"] = p.url;
        } else {
          map[p.phase] = p.url;
        }
      });
      setPhotos(map);
    } catch { /**/ }
  }, [jobId]);
  useEffect(() => { load(); }, [load]);

  // ── Native-first GPS pinging ──────────────────────────────────────────────────
  const startPinging = useCallback(async () => {
    if (!jobId || geoWatchId.current != null) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        await Geolocation.requestPermissions();
        const id = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 4000 },
          (pos, err) => {
            if (err || !pos) return;
            const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setMyPos(loc);
            api.trackingPing(jobId, loc.lat, loc.lng).catch(() => {});
          }
        );
        geoWatchId.current = id;
      } catch (err) {
        console.error("[VendorOrder] Native geo error:", err);
      }
    } else if (navigator.geolocation) {
      geoWatchId.current = navigator.geolocation.watchPosition(
        (p) => {
          const loc = { lat: p.coords.latitude, lng: p.coords.longitude };
          setMyPos(loc);
          api.trackingPing(jobId, loc.lat, loc.lng).catch(() => {});
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 4000, timeout: 8000 }
      );
    }
  }, [jobId]);

  const stopPinging = useCallback(async () => {
    if (geoWatchId.current == null) return;
    if (Capacitor.isNativePlatform()) {
      try {
        const { Geolocation } = await import("@capacitor/geolocation");
        await Geolocation.clearWatch({ id: String(geoWatchId.current) });
      } catch { /**/ }
    } else if (navigator.geolocation) {
      navigator.geolocation.clearWatch(Number(geoWatchId.current));
    }
    geoWatchId.current = null;
  }, []);

  useEffect(() => {
    if (status === "EN_ROUTE") {
      startPinging();
      const id = setInterval(() => {
        if (jobId) api.trackingSession(jobId).then((s) => { if (s?.destination) setDest(s.destination); }).catch(() => {});
      }, 6000);
      return () => clearInterval(id);
    }
    stopPinging();
  }, [status, jobId, startPinging, stopPinging]);
  useEffect(() => () => { stopPinging(); }, [stopPinging]);

  // ── Status actions with haptics ───────────────────────────────────────────────
  const onWay = async () => {
    if (!jobId) return;
    setBusy(true);
    try {
      await api.startTracking(jobId);
      setStatus("EN_ROUTE");
      startPinging();
      await haptic("heavy");
      toast({ title: "Client notified you're on the way" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  };

  const arrived = async () => {
    if (!jobId) return;
    setBusy(true);
    try {
      await api.arriveTracking(jobId);
      setStatus("ARRIVED");
      stopPinging();
      await haptic("medium");
      toast({ title: "Marked as arrived" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  };

  // ── Photo capture — native camera (live, no gallery) ──────────────────────────
  const captureNative = async (phase: Phase) => {
    if (!jobId) return;
    setBusy(true);
    try {
      const { Camera, CameraSource, CameraResultType } = await import("@capacitor/camera");
      const perm = await Camera.requestPermissions();
      if (perm.camera !== "granted") {
        toast({ title: "Camera permission denied", variant: "destructive" });
        return;
      }
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera, // Live only — Triple-Verify enforcement
      });
      if (!image.dataUrl) return;
      // Watermark + upload
      const blob = await fetch(image.dataUrl).then((r) => r.blob());
      const file = new File([blob], `${phase}.jpg`, { type: "image/jpeg" });
      const dataUrl = await watermarkImage(file);
      const { url } = await api.uploadImage(dataUrl, `jobs/${jobId}`);
      await api.uploadPhoto(jobId, phase, url);
      setPhotos((p) => ({ ...p, [phase]: url }));
      toast({ title: `${phase === "BEFORE" ? "Before" : "After"} photo uploaded` });
    } catch (err: any) {
      if (err?.message !== "User cancelled photos app") {
        toast({ title: "Camera error", description: err.message, variant: "destructive" });
      }
    } finally { setBusy(false); }
  };

  const captureWeb = async (phase: Phase, file?: File) => {
    if (!jobId || !file) return;
    setBusy(true);
    try {
      const dataUrl = await watermarkImage(file);
      const { url } = await api.uploadImage(dataUrl, `jobs/${jobId}`);
      await api.uploadPhoto(jobId, phase, url);
      setPhotos((p) => ({ ...p, [phase]: url }));
      toast({ title: `${phase === "BEFORE" ? "Before" : "After"} photo uploaded` });
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : String(e) });
    } finally { setBusy(false); }
  };

  const handleCapture = (phase: Phase, file?: File) => {
    if (Capacitor.isNativePlatform()) {
      captureNative(phase);
    } else {
      captureWeb(phase, file);
    }
  };

  const working = ["ARRIVED", "IN_PROGRESS", "WORKING"].includes(status);
  const canRequest = !!photos.BEFORE && !!photos.VENDOR_AFTER;

  const PhotoTile = ({ phase, label, canUpload = false }: { phase: Phase; label: string; canUpload?: boolean }) => {
    const isUploaded = !!photos[phase];
    return (
      <div className="aspect-square bg-muted rounded-full border border-dashed border-border flex flex-col items-center justify-center overflow-hidden relative">
        {canUpload && !Capacitor.isNativePlatform() && (
          <input ref={fileRefs[phase as "BEFORE"|"VENDOR_AFTER"]} type="file" accept="image/*" className="hidden" onChange={(e) => handleCapture(phase, e.target.files?.[0])} />
        )}
        {isUploaded ? (
          <img src={photos[phase]} alt={label} className="w-full h-full object-cover" />
        ) : canUpload ? (
          <button
            onClick={() => {
              if (Capacitor.isNativePlatform()) {
                captureNative(phase);
              } else {
                fileRefs[phase as "BEFORE"|"VENDOR_AFTER"].current?.click();
              }
            }}
            disabled={busy}
            className="flex flex-col items-center justify-center w-full h-full hover:bg-muted/80"
          >
            <Camera className="w-8 h-8 text-muted-foreground mb-2" />
            <span className="text-xs font-medium text-center px-2">Tap to capture {label}</span>
          </button>
        ) : (
          <>
            <Camera className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <span className="text-xs font-medium text-muted-foreground/50">{label} (Pending)</span>
          </>
        )}
      </div>
    );
  };

  return (
    <VendorLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-12 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <Badge className="bg-white/15 text-white border-0 hover:bg-white/15 mb-2">{status.replace(/_/g, " ")}</Badge>
            <h1 className="text-xl font-extrabold">{job?.description?.slice(0, 36) || "Active job"}</h1>
            <p className="text-white/70 text-sm mt-1">Muscat</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{job?.bid_amount ? Number(job.bid_amount).toFixed(2) : "—"}</p>
            <p className="text-[10px] text-white/70 uppercase font-medium">OMR locked</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-6 pb-6">
        <Card className="bg-card border-border shadow-md rounded-full">
          <CardContent className="p-4">
            {status === "ASSIGNED" && (
              <Button onClick={onWay} disabled={busy} className="w-full h-14 rounded-full text-lg font-bold">
                <Navigation className="w-5 h-5 mr-2" /> I'm On My Way
              </Button>
            )}
            {status === "EN_ROUTE" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-12 rounded-full border-border"><Phone className="w-4 h-4 mr-2" /> Call</Button>
                  <Button variant="outline" className="flex-1 h-12 rounded-full border-border"><MapPin className="w-4 h-4 mr-2" /> Map</Button>
                </div>
                <Button onClick={arrived} disabled={busy} className="w-full h-14 rounded-full text-lg font-bold">I Have Arrived</Button>
              </div>
            )}
            {working && (
              <div className="flex items-center gap-3 text-success p-2 bg-success/10 rounded-full justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" /> Job in Progress
              </div>
            )}
          </CardContent>
        </Card>

        {status === "EN_ROUTE" && (
          <Card className="bg-card border-border shadow-md rounded-full overflow-hidden">
            <div className="h-56 relative">
              <LiveMap vendor={myPos} destination={dest} className="w-full h-full" />
              <div className="absolute bottom-2 left-2 right-2 bg-background/90 backdrop-blur rounded-full px-3 py-2 text-xs font-semibold flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                {myPos ? "Sharing your live location with the client" : "Getting your GPS…"}
              </div>
            </div>
          </Card>
        )}

        <div className={`space-y-4 ${!working ? "opacity-50 pointer-events-none" : ""}`}>
          <h2 className="text-base font-extrabold border-t border-border pt-6">Completion proof (4-Way)</h2>
          <div className="grid grid-cols-2 gap-4">
            <PhotoTile phase="BEFORE" label="Vendor Before" canUpload={true} />
            <PhotoTile phase="VENDOR_AFTER" label="Vendor After" canUpload={true} />
            <PhotoTile phase="CONSUMER_BEFORE" label="Consumer Before" canUpload={false} />
            <PhotoTile phase="CONSUMER_AFTER" label="Consumer After" canUpload={false} />
          </div>
          <Button
            disabled={!canRequest || busy}
            onClick={async () => {
              await haptic("light");
              toast({ title: "Sent for client approval", description: "The client will review your photos and release funds." });
            }}
            className="w-full h-14 rounded-full text-lg font-bold bg-success hover:bg-success/90 text-success-foreground"
          >
            Request Client Approval
          </Button>
        </div>
      </div>
    </VendorLayout>
  );
}

