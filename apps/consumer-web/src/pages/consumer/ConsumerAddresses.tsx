import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronLeft, Plus, Trash2, Home, MapPin, Locate, Loader2, Building2, Briefcase, Navigation } from "lucide-react";
import { api, swr } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LocationPickerMap } from "@/components/consumer/LocationPickerMap";

const LABELS = [
  { id: "Home", icon: Home, label: "Home" },
  { id: "Office", icon: Briefcase, label: "Office" },
  { id: "Other", icon: Building2, label: "Other" },
];

function getCache(key: string) {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(`fixit_cache_${key}`) || "null"); } catch { return null; }
}

export default function ConsumerAddresses() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [addresses, setAddresses] = useState<any[]>(() => {
    const c = getCache("addresses");
    return Array.isArray(c) ? c : [];
  });
  const [addrLabel, setAddrLabel] = useState("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [addrDetails, setAddrDetails] = useState("");
  const [addrLat, setAddrLat] = useState<number | undefined>();
  const [addrLng, setAddrLng] = useState<number | undefined>();
  const [addrBusy, setAddrBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadAddresses = () => {
    swr("addresses", api.addresses, (a) => setAddresses(Array.isArray(a) ? a : []))
      .catch(() => setAddresses([]));
  };

  useEffect(() => { loadAddresses(); }, []);

  const locateMe = async () => {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      
      // Request permissions natively first
      const perm = await Geolocation.requestPermissions();
      if (perm.location !== 'granted' && perm.location !== 'prompt') {
        toast({ title: "Location access denied", description: "Please enable location permissions in app settings.", variant: "destructive" });
        return;
      }

      setLocating(true);
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setAddrLat(lat);
      setAddrLng(lng);

      // Reverse geocode with Nominatim (free)
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const d = await r.json();
        if (d?.display_name) setAddrDetails(d.display_name.slice(0, 100));
      } catch { /**/ }

      setLocating(false);
      toast({ title: "📍 Location found! Confirm on map" });
    } catch (err: any) {
      setLocating(false);
      toast({ title: "Location access denied or failed", description: err.message, variant: "destructive" });
    }
  };

  const addAddress = async () => {
    const label = addrLabel === "Other" ? customLabel.trim() : addrLabel;
    if (!label) { toast({ title: "Add a label (e.g. Home, Office)", variant: "destructive" }); return; }
    setAddrBusy(true);
    try {
      await api.addAddress(label, addrDetails.trim() || undefined, addrLat, addrLng);
      setAddrLabel("Home"); setCustomLabel(""); setAddrDetails("");
      setAddrLat(undefined); setAddrLng(undefined);
      setShowForm(false);
      loadAddresses();
      toast({ title: "✅ Address saved!" });
    } catch (e) {
      toast({ title: "Couldn't save", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setAddrBusy(false);
    }
  };

  const removeAddress = async (id: string) => {
    try {
      await api.deleteAddress(id);
      loadAddresses();
      toast({ title: "Address removed" });
    } catch (e) {
      toast({ title: "Couldn't delete", variant: "destructive" });
    }
  };

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0d1b2a] via-[#1b3d6e] to-[#1B6EF3] px-4 pt-10 pb-14">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-white/80 hover:text-white">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-bold hover:bg-white/20"
          >
            <Plus className="w-3.5 h-3.5" /> Add New
          </button>
        </div>
        <h1 className="text-2xl font-black text-white mt-3">My Addresses</h1>
        <p className="text-blue-200 text-sm mt-1">{addresses.length} saved location{addresses.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="px-4 -mt-6 pb-10 space-y-4">
        {/* Saved addresses list */}
        {addresses.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {addresses.map((a: any, i: number) => (
              <div
                key={a.address_id}
                className={`flex items-start gap-3 px-4 py-3.5 ${i !== addresses.length - 1 ? "border-b border-border" : ""}`}
              >
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{a.label}</p>
                  {a.details && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{a.details}</p>}
                  {a.lat && a.lng && (
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {Number(a.lat).toFixed(5)}, {Number(a.lng).toFixed(5)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeAddress(a.address_id)}
                  className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {addresses.length === 0 && !showForm && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold">No saved addresses</h3>
              <p className="text-sm text-muted-foreground mt-1">Add your home or office address for faster job posting</p>
            </div>
            <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-primary text-white font-bold rounded-2xl">
              Add First Address
            </button>
          </div>
        )}

        {/* Add address form */}
        {showForm && (
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold">Add New Address</p>
            </div>

            {/* Locate Me button */}
            <button
              onClick={locateMe}
              disabled={locating}
              className="w-full h-12 bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-primary/40 rounded-xl flex items-center justify-center gap-2 text-primary font-bold text-sm hover:bg-primary/15 transition-colors"
            >
              {locating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Getting location…</>
              ) : (
                <><Locate className="w-4 h-4" /> 📍 Use My Current Location</>
              )}
            </button>

            {/* Map picker */}
            <div className="h-52 rounded-xl overflow-hidden border border-border shadow-inner">
              <LocationPickerMap
                className="w-full h-full"
                initialLocation={addrLat && addrLng ? { lat: addrLat, lng: addrLng } : undefined}
                onLocationChange={(l: any) => {
                  setAddrLat(l.lat);
                  setAddrLng(l.lng);
                  if (l.address && !addrDetails) setAddrDetails(l.address);
                }}
              />
            </div>

            {/* Label selector */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Label</p>
              <div className="grid grid-cols-3 gap-2">
                {LABELS.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setAddrLabel(id)}
                    className={`flex flex-col items-center gap-1.5 p-3 border-2 rounded-xl transition-all ${addrLabel === id ? "border-primary bg-primary/8 text-primary" : "border-border text-muted-foreground"}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{label}</span>
                  </button>
                ))}
              </div>
              {addrLabel === "Other" && (
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Gym, Mom's House"
                  className="w-full h-11 bg-muted/60 border border-border rounded-xl px-3 text-sm mt-2 outline-none focus:border-primary"
                />
              )}
            </div>

            {/* Details */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Street / Details</p>
              <textarea
                value={addrDetails}
                onChange={(e) => setAddrDetails(e.target.value)}
                placeholder="Building, floor, street, area…"
                rows={2}
                className="w-full bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
              />
            </div>

            {addrLat && addrLng && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                <Navigation className="w-4 h-4 text-green-400 shrink-0" />
                <p className="text-xs text-green-400 font-semibold">
                  Location pinned: {addrLat.toFixed(5)}, {addrLng.toFixed(5)}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 h-12 border border-border rounded-xl font-bold text-muted-foreground hover:bg-muted/40"
              >
                Cancel
              </button>
              <button
                onClick={addAddress}
                disabled={addrBusy}
                className="flex-1 h-12 bg-primary text-white font-bold rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {addrBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save Address
              </button>
            </div>
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
