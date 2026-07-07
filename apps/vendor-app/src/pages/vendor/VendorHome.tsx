import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Star, MapPin, Briefcase, ChevronRight } from "lucide-react";
import { VendorHeader, SectionHeader } from "@/components/consumer/talabat-kit";
import { api, tokenClaims } from "@/lib/api";

const MUSCAT = { lat: 23.588, lng: 58.3829 };

export default function VendorHome() {
  const [online, setOnline] = useState(true);
  const [tokens, setTokens] = useState<number | null>(null);
  const [earnings, setEarnings] = useState<number | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const shopName = tokenClaims()?.full_name || "Your Shop";

  const load = useCallback(() => {
    import("@/lib/api").then(({ swr }) => {
      swr("vendor_tokens", api.bidTokens, (t) => setTokens(t?.tokens ?? 0)).catch(() => {});
      swr("vendor_analytics", api.vendorAnalytics, (a) => setEarnings(a?.total_earnings ?? a?.earnings ?? a?.lifetime_earnings ?? 0)).catch(() => {});
      swr("vendor_jobs", api.vendorMine, setJobs).catch(() => {});
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async (v: boolean) => {
    setOnline(v);
    try { await api.setAvailability(v, MUSCAT.lat, MUSCAT.lng); } catch { setOnline(!v); }
  };

  const active = jobs.find((j) => ["ASSIGNED", "DISPATCHED", "IN_PROGRESS", "ARRIVED"].includes(String(j.status))) ?? jobs[0];

  return (
    <VendorLayout>
      <VendorHeader shopName={shopName} online={online} onToggle={toggle}>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="bg-white/15 backdrop-blur rounded-full p-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-white/70">Bid Tokens</p>
            <div className="flex items-center gap-2 mt-1"><Zap className="w-5 h-5" /><span className="text-2xl font-black">{tokens ?? "—"}</span></div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-full p-3">
            <p className="text-[10px] uppercase font-bold tracking-wider text-white/70">Earnings</p>
            <div className="flex items-baseline gap-1 mt-1"><span className="text-2xl font-black">{earnings != null ? Number(earnings).toFixed(0) : "—"}</span><span className="text-xs text-white/80">OMR</span></div>
          </div>
        </div>
      </VendorHeader>

      <div className="px-4 -mt-6 space-y-6">
        {active && (
          <div>
            <SectionHeader title="Current assignment" />
            <Link href={`/vendor/order/${active.job_id}`}>
              <Card className="bg-card border-border shadow-md rounded-full relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary">{String(active.status).replace(/_/g, " ")}</Badge>
                    <span className="text-sm font-bold text-foreground">{active.bid_amount ? `${Number(active.bid_amount).toFixed(2)} OMR` : ""}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-1">{active.description?.slice(0, 40) || active.category_id}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" /> <span>Muscat</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        <div>
          <SectionHeader title="Quick actions" />
          <div className="grid grid-cols-2 gap-3">
            <Link href="/vendor/jobs" className="bg-card border border-border rounded-full shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Briefcase className="w-5 h-5" /></div>
              <span className="font-bold text-sm">Find Jobs</span>
            </Link>
            <Link href="/vendor/profile" className="bg-card border border-border rounded-full shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning"><Star className="w-5 h-5" /></div>
              <span className="font-bold text-sm">Reviews</span>
            </Link>
          </div>
        </div>

        <Link href="/vendor/jobs">
          <div className="bg-card border border-border rounded-full shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="font-bold text-sm">Browse the live job feed</p>
              <p className="text-xs text-muted-foreground mt-0.5">New jobs near you, updated in real time.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </VendorLayout>
  );
}
