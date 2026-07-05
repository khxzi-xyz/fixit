import { useEffect, useMemo, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, ChevronLeft, Plus } from "lucide-react";
import { Link } from "wouter";
import { ProCard } from "@/components/consumer/talabat-kit";
import { api } from "@/lib/api";

const MUSCAT = { lat: 23.588, lng: 58.3829 };

export default function ConsumerSearch() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [cats, setCats] = useState<{ category_id: string; display_name: string }[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    api.categories().then(setCats).catch(() => {});
    api.nearbyVendors(MUSCAT.lat, MUSCAT.lng).then((v) => setVendors(Array.isArray(v) ? v : [])).catch(() => {});
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
      <div className="sticky top-0 z-40 hero-blue text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-md space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/home"><ChevronLeft className="w-6 h-6" /></Link>
          <h1 className="text-xl font-extrabold">Search</h1>
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search pros, categories…"
            className="pl-10 h-12 bg-white text-foreground border-0 rounded-2xl shadow-sm" />
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1">
          {["All", ...cats.map((c) => c.display_name)].map((tag, i) => {
            const id = i === 0 ? "All" : cats[i - 1].category_id;
            const active = activeCat === id || (i === 0 && activeCat === "All");
            return (
              <button key={tag} onClick={() => setActiveCat(i === 0 ? "All" : id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"}`}>
                {tag}
              </button>
            );
          })}
        </div>

        <p className="text-sm font-bold text-foreground mt-4 mb-3">{filtered.length} pro{filtered.length === 1 ? "" : "s"} found</p>
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center">
            <p className="font-bold text-sm mb-1">Can't find what you need?</p>
            <p className="text-xs text-muted-foreground mb-4">Post a request and verified pros will bid on it.</p>
            <Link href={`/post-job${query ? `?q=${encodeURIComponent(query)}` : ""}`}>
              <span className="inline-flex items-center gap-2 hero-blue text-white font-bold px-5 py-3 rounded-xl">
                <Plus className="w-5 h-5" /> Request this service
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((v, i) => {
              const name = v.display_name || v.full_name || `Pro #${String(v.vendor_id ?? v.user_id ?? i).slice(0, 5)}`;
              return (
                <ProCard key={v.vendor_id ?? v.user_id ?? i}
                  name={name} initials={name.slice(0, 2).toUpperCase()}
                  category={v.primary_category ?? v.category_id ?? "General services"}
                  rating={typeof v.rating === "number" ? v.rating : 4.8}
                  jobs={v.jobs_completed ?? v.completed_jobs}
                  eta={v.distance_km ? `${Number(v.distance_km).toFixed(1)} km` : "Nearby"}
                  verified={v.is_verified ?? true} href="/post-job" />
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <Link href="/post-job">
            <div className="mt-5 flex items-center justify-center gap-2 border border-dashed border-primary/40 text-primary font-semibold rounded-2xl py-3 text-sm">
              <Plus className="w-4 h-4" /> Don't see it? Request a service
            </div>
          </Link>
        )}
      </div>
    </ConsumerLayout>
  );
}
