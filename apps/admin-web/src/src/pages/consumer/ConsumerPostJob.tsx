import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, Camera, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SearchSelect } from "@/components/ui/search-select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const MUSCAT = { lat: 23.588, lng: 58.3829 };

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(file); });
}

export default function ConsumerPostJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [cats, setCats] = useState<{ category_id: string; display_name: string }[]>([]);
  const [category, setCategory] = useState("");
  const [urgency, setUrgency] = useState("EMERGENCY");
  const [description, setDescription] = useState("");
  const [isBounty, setIsBounty] = useState(false);
  const [bountyPrice, setBountyPrice] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [upBusy, setUpBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setUpBusy(true);
    try {
      for (const f of Array.from(files).slice(0, 5)) {
        const dataUrl = await fileToDataUrl(f);
        try { const { url } = await api.uploadImage(dataUrl, "jobs"); setPhotos((p) => [...p, url]); }
        catch (e) { toast({ title: "Upload failed", description: e instanceof Error ? e.message : String(e) }); }
      }
    } finally { setUpBusy(false); }
  };

  useEffect(() => { api.categories().then(setCats).catch(() => { }); }, []);

  const handleAiRewrite = async () => {
    if (!description.trim()) return;
    setAiBusy(true);
    try {
      const r = await api.rewriteTicket(description, category);
      setDescription(r.ticket);
      setAiUsed(true);
      toast({ title: "Enhanced with AI", description: "Rewritten into a clear job ticket." });
    } catch (e) {
      toast({ title: "AI unavailable", description: e instanceof Error ? e.message : String(e) });
    } finally { setAiBusy(false); }
  };

  const selectedCat = cats.find((c: any) => c.category_id === category);
  const isTransport = selectedCat?.framework === 'B_TRANSIT';
  const isRoutine = selectedCat?.framework === 'C_ROUTINE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) return;
    setBusy(true);
    try {
      const loc = await new Promise<{ lat: number; lng: number }>((res) => {
        if (!navigator.geolocation) return res(MUSCAT);
        navigator.geolocation.getCurrentPosition((p) => res({ lat: p.coords.latitude, lng: p.coords.longitude }), () => res(MUSCAT), { timeout: 5000 });
      });
      await api.createJob({
        categoryId: category, urgency, description, ...loc,
        postingKind: isBounty ? "BOUNTY" : "STANDARD",
        bountyPrice: isBounty ? parseFloat(bountyPrice) || undefined : undefined,
        aiRewritten: aiUsed,
        mediaUrls: photos.filter((u) => u.startsWith("http")),
      });
      toast({ title: "Job Posted!", description: "Verified vendors have been notified." });
      setLocation("/home");
    } catch (err) {
      toast({ title: "Couldn't post", description: err instanceof Error ? err.message : String(err) });
    } finally { setBusy(false); }
  };

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-extrabold">Post a Job</h1>
        <p className="text-white/75 mt-1 text-sm">Describe what you need -get blind bids in minutes.</p>
      </div>
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Service Category</Label>
            <SearchSelect
              options={cats.filter((c: any) => c && c.category_id).map((c: any) => ({ value: c.category_id, label: String(c.display_name || c.name_en || c.category_id) }))}
              value={category}
              onChange={setCategory}
              placeholder="Choose a service…"
              searchPlaceholder="Search services (e.g. AC, plumbing)…"
              emptyText="No service matches -describe it below and we'll route it."
              onRequestService={() => toast({ title: "Request Received", description: "Our team will review your requested service." })}
            />
          </div>

          <div className="space-y-3">
            <Label>Urgency</Label>
            <div className="flex gap-2">
              {["EMERGENCY", "THIS_WEEK", "FLEXIBLE"].map((u) => (
                <button key={u} type="button" onClick={() => setUrgency(u)}
                  className={`flex-1 h-11 rounded-xl text-sm font-semibold border ${urgency === u ? "bg-primary text-white border-primary" : "bg-card border-border text-muted-foreground"}`}>
                  {u.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 relative">
            <div className="flex justify-between items-center">
              <Label>Description</Label>
              <Button type="button" variant="ghost" size="sm" disabled={aiBusy || !description.trim()} className="h-8 text-xs text-primary gap-1" onClick={handleAiRewrite}>
                <Sparkles className="w-3 h-3" /> {aiBusy ? "Rewriting…" : "AI Rewrite"}
              </Button>
            </div>
            <Textarea placeholder="E.g., kitchen sink pipe burst, water leaking…" className="min-h-[120px] bg-card rounded-xl border-border resize-none"
              value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          {!isTransport && (
            <div className="space-y-3">
              <Label>Photos or Video <span className="text-muted-foreground font-normal">(optional, up to 5, max 8MB each)</span></Label>
              <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" multiple className="hidden" onChange={(e) => addPhotos(e.target.files)} />

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" disabled={upBusy}
                  onClick={() => { if (fileRef.current) { fileRef.current.capture = "environment"; fileRef.current.click(); } }}>
                  <Camera className="w-4 h-4 mr-2" /> Snap Photo
                </Button>
                <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" disabled={upBusy}
                  onClick={() => { if (fileRef.current) { fileRef.current.removeAttribute("capture"); fileRef.current.click(); } }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg> Upload
                </Button>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {photos.map((p, i) => {
                    const isVideo = p.includes(".mp4") || p.includes(".mov") || p.includes(".webm");
                    return (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                        {isVideo ? (
                          <video src={p} className="w-full h-full object-cover" muted loop playsInline />
                        ) : (
                          <img src={p} className="w-full h-full object-cover" />
                        )}
                        <button type="button" onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {upBusy && <div className="w-20 h-20 rounded-xl bg-muted animate-pulse border border-border flex items-center justify-center text-xs text-muted-foreground">Uploading</div>}
            </div>
          )}

          {isTransport && (
            <div className="p-4 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
              Live location tracking and direct routing will be enabled once a driver accepts.
            </div>
          )}

          <div className="p-4 border border-border rounded-xl bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold text-foreground">Bounty Bargain</Label>
                <p className="text-xs text-muted-foreground mt-1">Set a fixed price instead of an auction.</p>
              </div>
              <Switch checked={isBounty} onCheckedChange={setIsBounty} />
            </div>
            {isBounty && (
              <div className="pt-4 border-t border-border">
                <Label>Your Price (OMR)</Label>
                <Input type="number" value={bountyPrice} onChange={(e) => setBountyPrice(e.target.value)} placeholder="0.00" className="mt-2 bg-background border-border h-12 text-lg" />
              </div>
            )}
          </div>

          <Button type="submit" disabled={busy} className="w-full h-14 text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(27,110,243,0.3)]">
            {busy ? "Posting…" : "Post Job"}
          </Button>
        </form>
      </div>
    </ConsumerLayout>
  );
}
