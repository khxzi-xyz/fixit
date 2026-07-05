import { useEffect, useMemo, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Search as SearchIcon, ChevronLeft, Plus, MapPin, Star, Sparkles, Filter, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { api } from "@/lib/api";

const MUSCAT = { lat: 23.588, lng: 58.3829 };

export default function ConsumerSearch() {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [cats, setCats] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.categories().catch(() => []),
      api.nearbyVendors(MUSCAT.lat, MUSCAT.lng).catch(() => []),
    ]).then(([c, v]) => {
      setCats(Array.isArray(c) ? c : []);
      setVendors(Array.isArray(v) ? v : []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vendors.filter((v) => {
      const cat = String(v.primary_category ?? v.category_id ?? "").toUpperCase();
      const name = String(v.display_name ?? v.full_name ?? "").toLowerCase();
      const catOk = activeCat === "All" || cat === activeCat.toUpperCase();
      const qOk = !q || name.includes(q) || cat.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [vendors, query, activeCat]);

  return (
    <ConsumerLayout>
      <div className="sticky top-0 z-40 hero-blue text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/home")} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-extrabold flex-1">Find Pros</h1>
          <button className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for plumbers, electricians..."
            className="w-full h-12 bg-white rounded-xl pl-10 pr-10 text-sm font-semibold outline-none shadow-sm text-foreground placeholder:text-muted-foreground/70"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-5 pb-24 space-y-4">
        {cats.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
            {["All", ...cats.map((c) => c.display_name)].map((tag, i) => {
              const id = i === 0 ? "All" : cats[i - 1].category_id;
              const active = activeCat === id || (i === 0 && activeCat === "All");
              return (
                <button
                  key={tag}
                  onClick={() => setActiveCat(i === 0 ? "All" : id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border ${active ? "bg-primary border-primary text-white shadow-sm" : "bg-card border-border text-muted-foreground"}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        <p className="text-sm font-bold text-foreground">
          {filtered.length} Pro{filtered.length !== 1 ? "s" : ""} Found
        </p>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 h-40 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
              <SearchIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-bold text-base mb-1">No pros found</p>
            <p className="text-xs text-muted-foreground mb-4">
              We couldn't find anyone matching your exact search. Try posting a request instead.
            </p>
            <button
              onClick={() => navigate(`/post-job${query ? `?q=${encodeURIComponent(query)}` : ""}`)}
              className="w-full h-10 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Request a Service
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((v, i) => {
              const name = v.display_name || v.full_name || `Pro #${String(v.vendor_id ?? v.user_id ?? i).slice(0, 5)}`;
              const initials = name.slice(0, 2).toUpperCase();
              const cat = v.primary_category ?? v.category_id ?? "General";
              const rating = typeof v.rating === "number" ? v.rating.toFixed(1) : "5.0";
              const jobs = v.jobs_completed ?? v.completed_jobs ?? 0;
              const dist = v.distance_km ? `${Number(v.distance_km).toFixed(1)}km` : "Nearby";

              return (
                <button
                  key={v.vendor_id ?? v.user_id ?? i}
                  onClick={() => navigate(`/vendor/${v.vendor_id ?? v.user_id}`)}
                  className="bg-card border border-border rounded-xl p-3 text-left hover:shadow-sm transition-shadow"
                >
                  <div className="relative w-full aspect-square rounded-xl bg-primary/10 flex flex-col items-center justify-center mb-3 overflow-hidden">
                    {v.avatar_url ? (
                      <img src={v.avatar_url} className="w-full h-full object-cover" alt={name} />
                    ) : (
                      <span className="text-2xl font-black text-primary/60">{initials}</span>
                    )}
                    {(v.is_verified ?? true) && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                        <Sparkles className="w-3 h-3 text-primary" />
                      </div>
                    )}
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/50 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex justify-center items-center gap-1 text-white">
                      <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-[9px] font-bold">{rating}</span>
                    </div>
                  </div>
                  
                  <p className="font-bold text-xs truncate">{name}</p>
                  <p className="text-[10px] text-muted-foreground truncate capitalize mb-2">{cat.toLowerCase()}</p>
                  
                  <div className="flex items-center gap-1 text-muted-foreground bg-muted w-fit px-1.5 py-0.5 rounded text-[9px] font-medium">
                    <MapPin className="w-2.5 h-2.5" />
                    <span>{dist}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <button
            onClick={() => navigate("/post-job")}
            className="w-full mt-4 flex items-center justify-center gap-2 border border-dashed border-primary/40 text-primary font-bold rounded-xl py-3 text-sm hover:bg-slate-50 dark:bg-slate-900 transition-colors"
          >
            <Plus className="w-4 h-4" /> Request Custom Service
          </button>
        )}
      </div>
    </ConsumerLayout>
  );
}
