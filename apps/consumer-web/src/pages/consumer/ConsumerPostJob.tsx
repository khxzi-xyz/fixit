import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { renderApi } from "@/lib/renderApi";
import { stageAndUpload } from "@/lib/upload";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";
import {
  ChevronLeft, ChevronRight, Zap, Clock, Sparkles,
  Camera, ImagePlus, MapPin, X, ArrowRight, Loader2, CheckCircle2,
  Tag, DollarSign, Siren, Calendar,
} from "lucide-react";

import { ServiceIcon } from "@/components/ServiceIcon";

// ─── Service catalog with per-service configuration ───────────────────────────
const SERVICE_CATEGORIES = [
  // Home Services
  { id: "ELECTRICIAN", label: "Electrician", group: "Home", needsPhotos: true, needsParts: true, needsWarranty: true },
  { id: "PLUMBER", label: "Plumber", group: "Home", needsPhotos: true, needsParts: true, needsWarranty: true },
  { id: "CARPENTER", label: "Carpenter", group: "Home", needsPhotos: true, needsParts: true, needsWarranty: true },
  { id: "AC_REPAIR", label: "AC Repair", group: "Home", needsPhotos: true, needsParts: true, needsWarranty: true },
  { id: "PAINTER", label: "Painter", group: "Home", needsPhotos: true, needsParts: false, needsWarranty: false },
  { id: "HANDYMAN", label: "Handyman", group: "Home", needsPhotos: true, needsParts: false, needsWarranty: false },
  { id: "LOCKSMITH", label: "Locksmith", group: "Home", needsPhotos: false, needsParts: true, needsWarranty: true },
  { id: "PEST_CONTROL", label: "Pest Control", group: "Home", needsPhotos: true, needsParts: false, needsWarranty: true },
  { id: "CLEANER", label: "Home Cleaning", group: "Home", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "GARDENER", label: "Gardening", group: "Home", needsPhotos: true, needsParts: false, needsWarranty: false },
  // Vehicles
  { id: "MECHANIC", label: "Mechanic", group: "Vehicles", needsPhotos: true, needsParts: true, needsWarranty: true },
  { id: "TAXI", label: "Taxi / Ride", group: "Vehicles", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "TOW_TRUCK", label: "Tow Truck", group: "Vehicles", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "CAR_WASH", label: "Car Wash", group: "Vehicles", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "TIRE_SERVICE", label: "Tire Service", group: "Vehicles", needsPhotos: true, needsParts: true, needsWarranty: true },
  // Tech
  { id: "PHONE_REPAIR", label: "Phone Repair", group: "Tech", needsPhotos: true, needsParts: true, needsWarranty: true },
  { id: "LAPTOP_REPAIR", label: "Laptop / PC", group: "Tech", needsPhotos: true, needsParts: true, needsWarranty: true },
  { id: "TV_REPAIR", label: "TV / Electronics", group: "Tech", needsPhotos: true, needsParts: true, needsWarranty: true },
  { id: "CCTV", label: "CCTV Install", group: "Tech", needsPhotos: true, needsParts: true, needsWarranty: true },
  { id: "NETWORK", label: "Network / WiFi", group: "Tech", needsPhotos: false, needsParts: false, needsWarranty: false },
  // Professional
  { id: "MOVERS", label: "Moving Help", group: "Professional", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "DELIVERY", label: "Delivery", group: "Professional", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "TUTOR", label: "Tutor / Lessons", group: "Professional", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "PHYSIOTHERAPY", label: "Physiotherapy", group: "Professional", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "BARBER", label: "Barber / Salon", group: "Professional", needsPhotos: false, needsParts: false, needsWarranty: false },
  // Other
  { id: "TAILORING", label: "Tailoring", group: "Other", needsPhotos: true, needsParts: false, needsWarranty: false },
  { id: "PHOTOGRAPHY", label: "Photography", group: "Other", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "WEDDING_PLAN", label: "Event Planning", group: "Other", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "COOK", label: "Home Cook", group: "Other", needsPhotos: false, needsParts: false, needsWarranty: false },
  { id: "OTHER", label: "Other Service", group: "Other", needsPhotos: false, needsParts: false, needsWarranty: false },
] as const;

type ServiceId = typeof SERVICE_CATEGORIES[number]["id"];

// ids must match the backend enum + jobs.urgency DB check: EMERGENCY | THIS_WEEK | FLEXIBLE
const URGENCY = [
  { id: "EMERGENCY", label: "Emergency", sub: "Right now", icon: <Siren className="w-5 h-5 mb-1" />, color: "border-red-500 bg-red-500/10 text-red-400" },
  { id: "THIS_WEEK", label: "This Week", sub: "Within days", icon: <Zap className="w-5 h-5 mb-1" />, color: "border-orange-400 bg-orange-400/10 text-orange-400" },
  { id: "FLEXIBLE", label: "Flexible", sub: "Anytime", icon: <Calendar className="w-5 h-5 mb-1" />, color: "border-primary/30 bg-blue-400/10 text-primary" },
] as const;

const GROUPS = ["Home", "Vehicles", "Tech", "Professional", "Other"];

export default function ConsumerPostJob() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState<"category" | "details" | "review">("category");
  const [selectedCat, setSelectedCat] = useState<ServiceId | null>(null);
  const [urgency, setUrgency] = useState<string>("THIS_WEEK");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [bounty, setBounty] = useState("");
  const [useBounty, setUseBounty] = useState(false);
  const [aiRewriting, setAiRewriting] = useState(false);
  const [posting, setPosting] = useState(false);
  const [done, setDone] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [fetchingLoc, setFetchingLoc] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const cat = SERVICE_CATEGORIES.find((c) => c.id === selectedCat);

  // Excluded photos from draft storage to prevent QuotaExceededError
  useEffect(() => {
    try {
      const saved = localStorage.getItem("fixit_job_draft");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.step) setStep(d.step);
        if (d.selectedCat) setSelectedCat(d.selectedCat);
        if (d.urgency) setUrgency(d.urgency);
        if (d.description) setDescription(d.description);
        if (d.bounty) setBounty(d.bounty);
        if (d.useBounty) setUseBounty(d.useBounty);
        if (d.lat) setLat(d.lat);
        if (d.lng) setLng(d.lng);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!done) {
      localStorage.setItem("fixit_job_draft", JSON.stringify({
        step, selectedCat, urgency, description, bounty, useBounty, lat, lng
      }));
    }
  }, [step, selectedCat, urgency, description, bounty, useBounty, lat, lng, done]);

  const fetchLocation = async () => {
    setFetchingLoc(true);
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const perm = await Geolocation.requestPermissions();
      if (perm.location === 'granted' || perm.coarseLocation === 'granted') {
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        toast({ title: "Location Captured ✅" });
      } else {
        toast({ title: "Location Denied", description: "Enable location in settings to share exactly where you are.", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Couldn't get location", description: e.message, variant: "destructive" });
    } finally {
      setFetchingLoc(false);
    }
  };

  const rewriteWithAI = async () => {
    if (!description.trim() || !selectedCat) return;
    setAiRewriting(true);
    try {
      const better = await api.aiRewrite(description);
      if (better && better.trim()) setDescription(better);
    } catch {}
    setAiRewriting(false);
  };

  /**
   * Photo capture — uses @capacitor/camera (CameraSource.Camera) on native
   * to enforce live Triple-Verify (no gallery bypass). Falls back to file input on web.
   */
  const capturePhoto = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Camera, CameraSource, CameraResultType } = await import("@capacitor/camera");
        const perm = await Camera.requestPermissions();
        if (perm.camera !== "granted") {
          toast({ title: "Camera permission denied", description: "Enable camera access in settings.", variant: "destructive" });
          return;
        }
        const image = await Camera.getPhoto({
          quality: 85,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera, // Live camera ONLY — no gallery (Triple-Verify)
        });
        if (image.dataUrl) {
          setPhotos((p) => [...p, image.dataUrl!].slice(0, 10));
        }
      } catch (err: any) {
        if (err?.message !== "User cancelled photos app") {
          toast({ title: "Camera error", description: err.message, variant: "destructive" });
        }
      }
    } else {
      fileRef.current?.click();
    }
  };

  const addPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach((f) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) setPhotos((p) => [...p, ev.target!.result as string].slice(0, 10));
        };
        reader.readAsDataURL(f);
      });
    }
  };

  const submitJob = async () => {
    if (!description.trim()) { toast({ title: "Please add a description" }); return; }
    if (useBounty && !bounty) { toast({ title: "Enter a budget amount" }); return; }
    if (!lat || !lng) { toast({ title: "Please fetch your location first" }); return; }
    
    setPosting(true);
    try {
      // Stage photos through filesystem before uploading (prevents memory-pressure loss on Android)
      const mediaUrls = await Promise.all(
        photos.map((p) => stageAndUpload(p, "jobs").catch(() => ""))
      ).then((urls) => urls.filter(Boolean));

      await api.createJob({
        categoryId: selectedCat,
        urgency,
        description,
        lat,
        lng,
        postingKind: useBounty ? "BOUNTY" : "STANDARD",
        bountyPrice: useBounty && bounty ? parseFloat(bounty) : undefined,
        mediaUrls,
      });

      localStorage.removeItem("fixit_job_draft");

      // Haptic feedback: light pulse on success
      import("@capacitor/haptics").then(({ Haptics, ImpactStyle }) => {
        Haptics.impact({ style: ImpactStyle.Light });
      }).catch(() => {});

      setDone(true);
    } catch (e: any) {
      toast({ title: "Couldn't post job", description: e.message || "Network connection failed", variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  if (done) {
    return (
      <ConsumerLayout>
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-6">
          <div className="w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">Job Posted!</h2>
            <p className="text-muted-foreground mt-2 text-sm">Your job is now live. Vendors are being notified and will start sending bids soon.</p>
          </div>
          <div className="flex gap-3 w-full max-w-xs">
            <button onClick={() => navigate("/my-jobs")} className="flex-1 h-12 bg-primary text-white font-bold rounded-full">
              View My Jobs
            </button>
            <button onClick={() => { setDone(false); setStep("category"); setSelectedCat(null); setDescription(""); setPhotos([]); }} className="flex-1 h-12 border border-border rounded-full font-bold text-muted-foreground hover:bg-muted/40">
              Post Another
            </button>
          </div>
        </div>
      </ConsumerLayout>
    );
  }

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="bg-primary text-primary-foreground border-b border-border px-5 pt-[calc(env(safe-area-inset-top,1rem)+1.5rem)] pb-6 rounded-b-[2rem] shadow-lg relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-4 mb-6 relative z-10">
          {step !== "category" && (
            <button onClick={() => setStep(step === "review" ? "details" : "category")} className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-sm">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          {step === "category" && (
            <button onClick={() => navigate("/home")} className="w-10 h-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-all shadow-sm">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
          )}
          <div className="flex-1 flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2 drop-shadow-sm">
                {step === "category" ? "What do you need?" : step === "details" ? cat?.label : "Review & Post"}
              </h1>
              <p className="text-primary-foreground/80 text-xs mt-1 font-medium">
                {step === "category" ? "Pick a service" : step === "details" ? "Describe your job" : "Confirm your job details"}
              </p>
            </div>
            {step !== "category" && (
              <button
                onClick={() => {
                  toast({ title: "Draft Saved 💾", description: "Your job is saved. Resume from My Jobs → Drafts." });
                  navigate("/my-jobs");
                }}
                className="text-white/70 text-xs font-bold hover:text-white transition-colors px-2 py-1 rounded-full hover:bg-white/10"
              >
                Save Draft
              </button>
            )}
          </div>
        </div>
        {/* Steps */}
        <div className="flex gap-1.5">
          {(["category", "details", "review"] as const).map((s, i) => (
            <div key={s} className={`h-1 rounded-full flex-1 transition-all ${step === s || (i === 0 && step !== "category") || (i === 1 && step === "review") ? "bg-white" : "bg-white/20"}`} />
          ))}
        </div>
      </div>

      <div className="px-4 mt-6 pb-10">
        {/* STEP 1: Category */}
        {step === "category" && (
          <div className="space-y-4">
            <div className="relative mb-6">
              <input 
                type="text" 
                value={aiInput} 
                onChange={(e) => setAiInput(e.target.value)} 
                placeholder="Search for a service..."
                className="w-full h-12 bg-card border border-border rounded-full px-4 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
              />
            </div>

            {GROUPS.map((group) => {
              const filtered = SERVICE_CATEGORIES.filter(c => c.group === group && (!aiInput || c.label.toLowerCase().includes(aiInput.toLowerCase()) || c.id.toLowerCase().includes(aiInput.toLowerCase())));
              if (filtered.length === 0) return null;
              return (
              <div key={group}>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">{group}</p>
                <div className="grid grid-cols-3 gap-2">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCat(c.id as ServiceId); setStep("details"); }}
                      className={`flex flex-col items-center gap-2.5 p-3.5 bg-card border rounded-full transition-all hover:shadow-md hover:-translate-y-0.5 ${selectedCat === c.id ? "border-primary bg-slate-50 dark:bg-slate-900 ring-2 ring-primary/20" : "border-border/60 hover:border-primary/30"}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                        <ServiceIcon id={c.id} className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-center leading-tight">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              );
            })}
          </div>
        )}

        {/* STEP 2: Details */}
        {step === "details" && cat && (
          <div className="space-y-4">
            {/* Urgency */}
            <div className="bg-card border border-border rounded-full p-4 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Urgency</p>
              <div className="grid grid-cols-3 gap-2">
                {URGENCY.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setUrgency(u.id)}
                    className={`flex flex-col items-center gap-1 p-3 border-2 rounded-full transition-all text-center ${urgency === u.id ? u.color : "border-border text-muted-foreground"}`}
                  >
                    <div className="flex justify-center items-center h-8">{u.icon}</div>
                    <span className="text-[11px] font-black">{u.label}</span>
                    <span className="text-[10px] opacity-70">{u.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded-full p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Describe the Job</p>
                <button
                  onClick={rewriteWithAI}
                  disabled={aiRewriting || !description.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-full hover:bg-primary/20 disabled:opacity-40 transition-colors"
                >
                  {aiRewriting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  AI Improve
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  cat.id === "TAXI" ? "From: Muscat Airport → To: Qurum, 2 passengers, 10 AM" :
                    cat.id === "PLUMBER" ? "Kitchen sink is leaking under the pipe joint, need fixing ASAP" :
                      cat.id === "ELECTRICIAN" ? "Power socket not working in living room, might be a fuse issue" :
                        `Describe what you need from the ${cat.label}…`
                }
                rows={4}
                className="w-full bg-muted/60 border border-border rounded-full px-3 py-2.5 text-sm font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            {/* Photos (only if service needs them) */}
            {cat.needsPhotos && (
              <div className="bg-card border border-border rounded-full p-4 shadow-sm">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
                  Photos / Video <span className="text-muted-foreground font-normal">(live camera only, max 10)</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {photos.map((p, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-full overflow-hidden border border-border">
                      {p.includes("video") ? (
                        <video src={p} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={p} className="w-full h-full object-cover" />
                      )}
                      <button onClick={() => setPhotos((prev) => prev.filter((_, pi) => pi !== i))} className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {photos.length < 10 && (
                    <button onClick={capturePhoto} className="w-16 h-16 rounded-full border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] font-bold">Add</span>
                    </button>
                  )}
                  {/* Web fallback file input */}
                  <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={addPhoto} />
                </div>
              </div>
            )}

            {/* Bounty option */}
            <div className="bg-card border border-border rounded-full p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Set Fixed Price</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Name your budget -vendors compete at or below it</p>
                </div>
                <button
                  onClick={() => setUseBounty((v) => !v)}
                  className={`w-12 h-6 rounded-full transition-all relative ${useBounty ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${useBounty ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
              {useBounty && (
                <div className="mt-3 relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={bounty}
                    onChange={(e) => setBounty(e.target.value)}
                    placeholder="0.000"
                    min="1"
                    step="0.5"
                    className="w-full h-11 bg-muted/60 border border-border rounded-full pl-8 pr-12 text-base font-bold outline-none focus:border-primary"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">OMR</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep("review")}
              disabled={!description.trim()}
              className="w-full h-14 bg-primary text-white font-black rounded-full flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_4px_20px_rgba(27,110,243,0.4)] hover:shadow-[0_4px_30px_rgba(27,110,243,0.6)] transition-all"
            >
              Review Job <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* STEP 3: Review */}
        {step === "review" && cat && (
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-full p-4 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <ServiceIcon id={cat.id} className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-black text-base">{cat.label}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><span className="[&>svg]:w-3 [&>svg]:h-3 [&>svg]:mb-0">{URGENCY.find((u) => u.id === urgency)?.icon}</span> {URGENCY.find((u) => u.id === urgency)?.label}</p>
                </div>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Job Description</p>
                <p className="text-sm text-foreground leading-relaxed">{description}</p>
              </div>
              {photos.length > 0 && (
                <>
                  <div className="h-px bg-border" />
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Photos ({photos.length})</p>
                    <div className="flex gap-2">
                      {photos.map((p, i) => (
                        <img key={i} src={p} className="w-14 h-14 rounded-full object-cover border border-border" />
                      ))}
                    </div>
                  </div>
                </>
              )}
              {useBounty && bounty && (
                <>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">Fixed Budget</span>
                    </div>
                    <span className="font-black text-primary">{bounty} OMR</span>
                  </div>
                </>
              )}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-full p-3 text-sm text-primary flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{lat ? "Location Ready. Vendors near you will be notified." : "We need your location to find nearby vendors."}</span>
              </div>
              {!lat && (
                <button 
                  onClick={fetchLocation} 
                  disabled={fetchingLoc}
                  className="mt-2 bg-primary text-white py-2 rounded-full font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {fetchingLoc ? "Finding you..." : "Get My Location"}
                </button>
              )}
            </div>

            <button
              onClick={submitJob}
              disabled={posting}
              className="w-full h-14 bg-primary text-white font-black rounded-full flex items-center justify-center gap-2 disabled:opacity-60 shadow-[0_4px_20px_rgba(27,110,243,0.4)] hover:shadow-[0_4px_30px_rgba(27,110,243,0.6)] transition-all"
            >
              {posting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Post Job Now</>}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Your job will be visible to verified vendors in your area
            </p>
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
