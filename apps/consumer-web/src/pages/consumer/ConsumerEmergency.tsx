import { useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Siren, Phone, MapPin, ChevronLeft, ShieldAlert, Zap, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";

const EMERGENCY_TYPES = [
  { type: "PIPE_BURST", label: "Pipe Burst / Major Water Leak", color: "from-blue-600 to-cyan-700", icon: "💧" },
  { type: "ELECTRICAL_FIRE", label: "Electrical Short / Circuit Fire", color: "from-red-600 to-amber-700", icon: "⚡" },
  { type: "AC_HEATWAVE", label: "AC Total Failure in 45°C Heat", color: "from-orange-600 to-red-700", icon: "❄️" },
  { type: "LOCKOUT", label: "Door Lockout Emergency", color: "from-purple-600 to-indigo-700", icon: "🔑" },
  { type: "GAS_LEAK", label: "Gas Stove / Cylinder Leak", color: "from-emerald-600 to-teal-700", icon: "🔥" },
];

export default function ConsumerEmergency() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState("PIPE_BURST");
  const [address, setAddress] = useState("Muscat, Oman");
  const [dispatching, setDispatching] = useState(false);
  const [activeSos, setActiveSos] = useState<any>(null);

  const trigger = async () => {
    setDispatching(true);
    try {
      const res = await api.triggerEmergency(selectedType, address);
      setActiveSos(res);
      toast({ title: "SOS Dispatch Active! 🚨", description: "Pro assigned & en route." });
    } catch (e: any) {
      toast({ title: "Dispatch error", description: e.message, variant: "destructive" });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="bg-gradient-to-br from-red-950 via-red-900 to-amber-900 px-4 pt-10 pb-14 text-white relative">
        <button onClick={() => navigate("/home")} className="flex items-center gap-2 text-white/80 hover:text-white mb-3">
          <ChevronLeft className="w-5 h-5" /> Home
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Siren className="w-7 h-7 text-red-400 animate-pulse" />
          <h1 className="text-2xl font-black">Emergency SOS Dispatch</h1>
        </div>
        <p className="text-red-200 text-sm">Priority matching within 5km radius • Guaranteed 15-min ETA</p>
      </div>

      <div className="px-4 -mt-6 pb-28 space-y-4 relative z-10">
        {activeSos ? (
          <div className="bg-card border-2 border-red-500 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-12 h-12 bg-red-500/15 rounded-full flex items-center justify-center">
                <Siren className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">Responder En Route!</h2>
                <p className="text-xs text-muted-foreground font-semibold">Priority emergency code: {activeSos.emergency_id}</p>
              </div>
            </div>

            <div className="bg-muted/60 border border-border rounded-full p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Responder</span>
                <span className="text-sm font-extrabold text-foreground">{activeSos.responder.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Est. Arrival</span>
                <span className="text-sm font-black text-green-500 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> {activeSos.responder.eta_mins} minutes ({activeSos.responder.distance_km}km)
                </span>
              </div>
            </div>

            <a
              href={`tel:${activeSos.responder.phone}`}
              className="w-full h-14 bg-red-600 text-white font-extrabold rounded-full flex items-center justify-center gap-2 shadow-lg"
            >
              <Phone className="w-5 h-5" /> Call Responder Now ({activeSos.responder.phone})
            </a>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-3xl p-4 shadow-sm space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Emergency Type</p>
              <div className="space-y-2">
                {EMERGENCY_TYPES.map((e) => (
                  <button
                    key={e.type}
                    onClick={() => setSelectedType(e.type)}
                    className={`w-full flex items-center justify-between p-4 rounded-full border transition-all text-left ${
                      selectedType === e.type
                        ? "border-red-500 bg-red-500/10 shadow"
                        : "border-border bg-muted/30 hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{e.icon}</span>
                      <span className="text-sm font-bold">{e.label}</span>
                    </div>
                    {selectedType === e.type && <CheckCircle2 className="w-5 h-5 text-red-500" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-3xl p-4 shadow-sm space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Emergency Location
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter street or villa address"
                className="w-full h-12 bg-muted/60 border border-border rounded-full px-3 text-sm font-semibold outline-none focus:border-red-500"
              />
            </div>

            <button
              onClick={trigger}
              disabled={dispatching}
              className="w-full h-16 bg-gradient-to-r from-red-600 to-amber-600 text-white font-black text-lg rounded-full flex items-center justify-center gap-3 shadow-xl hover:opacity-90 active:scale-98 transition-all"
            >
              <Siren className="w-6 h-6 animate-pulse" />
              {dispatching ? "Broadcasting SOS..." : "Trigger Instant SOS Dispatch"}
            </button>
          </>
        )}
      </div>
    </ConsumerLayout>
  );
}
