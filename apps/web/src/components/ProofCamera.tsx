import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, MapPin, X } from "lucide-react";
import { api } from "@/lib/api";

type Meta = { at: string; lat: number | null; lng: number | null; url: string };

/** Live-camera proof capture (Triple-Verify). Stamps date/time + GPS coords on
 *  the frame, uploads to Supabase Storage, returns the public URL + metadata. */
export function ProofCamera({ label, folder = "proof", onCaptured }: { label: string; folder?: string; onCaptured: (m: Meta) => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      } catch (e) {
        setErr("Camera access denied. Allow camera to capture proof.");
      }
    })();
    return stop;
  }, [open, stop]);

  const getCoords = () =>
    new Promise<{ lat: number | null; lng: number | null }>((resolve) => {
      if (!navigator.geolocation) return resolve({ lat: null, lng: null });
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => resolve({ lat: null, lng: null }),
        { enableHighAccuracy: true, timeout: 6000 },
      );
    });

  const capture = async () => {
    const video = videoRef.current;
    if (!video) return;
    setBusy(true); setErr(null);
    try {
      const { lat, lng } = await getCoords();
      const now = new Date();
      const w = video.videoWidth || 1280, h = video.videoHeight || 720;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, w, h);

      // Proof watermark bar
      const barH = Math.round(h * 0.16);
      ctx.fillStyle = "rgba(11,37,69,0.82)";
      ctx.fillRect(0, h - barH, w, barH);
      ctx.fillStyle = "#fff";
      const fs = Math.round(h * 0.032);
      ctx.font = `700 ${fs}px system-ui, sans-serif`;
      const date = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      const time = now.toLocaleTimeString("en-GB");
      const coord = lat != null ? `${lat.toFixed(5)}, ${lng!.toFixed(5)}` : "GPS unavailable";
      ctx.fillText(`FixIt Verified · ${date} ${time}`, Math.round(w * 0.03), h - barH + fs * 1.4);
      ctx.font = `500 ${Math.round(fs * 0.85)}px system-ui, sans-serif`;
      ctx.fillText(`📍 ${coord}`, Math.round(w * 0.03), h - barH + fs * 2.9);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const { url } = await api.uploadImage(dataUrl, folder);
      onCaptured({ at: now.toISOString(), lat, lng, url });
      stop(); setOpen(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Capture failed");
    } finally { setBusy(false); }
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--azure)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--navy)]">
        <Camera className="h-4 w-4" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-bold text-[var(--navy)]">Capture proof</span>
              <button onClick={() => { stop(); setOpen(false); }} className="grid h-8 w-8 place-items-center rounded-lg border border-border"><X className="h-4 w-4" /></button>
            </div>
            <div className="relative bg-black">
              <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full object-cover" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 rounded-lg bg-[var(--navy)]/80 px-2 py-1 text-[11px] font-semibold text-white">
                <MapPin className="h-3 w-3" /> GPS + timestamp stamped on capture
              </div>
            </div>
            {err && <p className="px-4 pt-3 text-xs font-medium text-red-600">{err}</p>}
            <div className="p-4">
              <button onClick={capture} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {busy ? "Stamping & uploading…" : "Capture with proof"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
