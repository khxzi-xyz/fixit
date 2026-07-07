import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Plus, MapPin, Home, Briefcase, Navigation, MoreVertical } from "lucide-react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Button } from "@/components/ui/button";

export default function SavedAddresses() {
  const [, navigate] = useLocation();
  const [addresses, setAddresses] = useState([
    { id: 1, type: "home", label: "Home", text: "Al Khuwair 33, Way 3341, Villa 12", meta: "Gate code: 1234" },
    { id: 2, type: "work", label: "Office", text: "Knowledge Oasis Muscat, KOM 4, Floor 3", meta: "Call reception on arrival" }
  ]);
  const [showAdd, setShowAdd] = useState(false);

  return (
    <ConsumerLayout>
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/profile")} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-black">Saved Addresses</h1>
          </div>
          <button onClick={() => setShowAdd(true)} className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {addresses.map(a => (
            <div key={a.id} className="bg-card border border-border rounded-full p-4 flex gap-4 items-start shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                {a.type === "home" ? <Home className="w-6 h-6 text-primary" /> : <Briefcase className="w-6 h-6 text-primary" />}
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-bold">{a.label}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-snug">{a.text}</p>
                {a.meta && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-full">
                    <Navigation className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-semibold text-muted-foreground">{a.meta}</span>
                  </div>
                )}
              </div>
              <button className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          ))}

          {addresses.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-muted-foreground opacity-50" />
              </div>
              <h2 className="text-lg font-bold">No saved addresses</h2>
              <p className="text-muted-foreground text-sm mt-1">Add your home or work to book faster.</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] bg-background flex flex-col">
          <div className="border-b border-border px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAdd(false)} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-black">Add Address</h1>
            </div>
          </div>
          <div className="flex-1 relative bg-muted">
            {/* Fake Map */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=Oman&zoom=10&size=600x400&sensor=false')] bg-cover bg-center opacity-30" />
              <MapPin className="w-12 h-12 text-primary absolute -mt-6 animate-bounce" />
            </div>
          </div>
          <div className="bg-card p-6 rounded-t-3xl shadow-2xl z-10 border-t border-border -mt-6">
            <h3 className="font-bold mb-4">Address Details</h3>
            <div className="space-y-4 mb-6">
              <input type="text" placeholder="Building / Villa Name" className="w-full h-12 bg-muted rounded-full px-4 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
              <input type="text" placeholder="Access Instructions (e.g., Gate Code)" className="w-full h-12 bg-muted rounded-full px-4 text-sm outline-none focus:ring-2 focus:ring-primary/50" />
              <div className="flex gap-2">
                <button className="flex-1 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm">Home</button>
                <button className="flex-1 h-10 rounded-full bg-muted font-bold text-sm">Work</button>
                <button className="flex-1 h-10 rounded-full bg-muted font-bold text-sm">Other</button>
              </div>
            </div>
            <Button className="w-full h-14 rounded-full text-lg font-bold" onClick={() => setShowAdd(false)}>
              Save Address
            </Button>
          </div>
        </div>
      )}
    </ConsumerLayout>
  );
}
