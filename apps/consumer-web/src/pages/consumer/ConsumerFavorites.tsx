import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Heart, Star, ChevronLeft, Phone, ShieldCheck, Briefcase, Plus, Trash2,
} from "lucide-react";

export default function ConsumerFavorites() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFavorites()
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false));
  }, []);

  const removeFav = async (vendor: any) => {
    try {
      const res = await api.toggleFavorite(vendor);
      setFavorites(res.favorites);
      toast({ title: "Removed from Favorites" });
    } catch { /**/ }
  };

  return (
    <ConsumerLayout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-14 text-white">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-white/80 hover:text-white mb-3">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-7 h-7 text-pink-400 fill-pink-400" />
          <h1 className="text-2xl font-black">Saved Pros & Favorites</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm">Your trusted roster of bookmarked local specialists</p>
      </div>

      <div className="px-4 -mt-6 pb-28 space-y-4 relative z-10">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card border border-border rounded-3xl p-4 h-32 animate-pulse" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-3">
            <Heart className="w-12 h-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-bold text-base">No saved pros yet</h3>
            <p className="text-xs text-muted-foreground">Bookmark your favorite plumbers, electricians, and technicians for 1-tap rebooking.</p>
            <button onClick={() => navigate("/search")} className="px-6 py-2.5 bg-primary text-white font-bold rounded-full text-xs">
              Explore Pros
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((v) => (
              <div key={v.vendor_id} className="bg-card border border-border rounded-3xl p-4 shadow-md space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img src={v.avatar_url} alt={v.display_name} className="w-12 h-12 rounded-full object-cover border border-border" />
                    <div>
                      <h3 className="font-extrabold text-sm flex items-center gap-1">
                        {v.display_name} {v.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-primary" />}
                      </h3>
                      <p className="text-xs text-muted-foreground font-semibold capitalize">{v.primary_category.toLowerCase()}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                        <span className="flex items-center gap-0.5 font-black text-yellow-500">
                          <Star className="w-3 h-3 fill-yellow-400" /> {v.rating}
                        </span>
                        <span className="text-muted-foreground">• {v.completed_jobs} Jobs Completed</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeFav(v)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {v.note && (
                  <p className="text-xs text-muted-foreground/90 bg-muted/60 rounded-full p-2.5 font-medium italic">
                    "{v.note}"
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => navigate(`/post-job?category=${v.primary_category}`)}
                    className="flex-1 py-2.5 bg-primary text-white font-bold text-xs rounded-full shadow hover:bg-primary/90"
                  >
                    Direct Request
                  </button>
                  <a
                    href={`tel:${v.phone}`}
                    className="px-4 py-2.5 bg-muted/80 border border-border rounded-full font-bold text-xs flex items-center gap-1.5 hover:bg-muted"
                  >
                    <Phone className="w-3.5 h-3.5 text-primary" /> Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
