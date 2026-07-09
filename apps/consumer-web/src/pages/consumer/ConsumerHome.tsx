import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api, getToken, swr } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Bell, MapPin, Search, ChevronRight, Zap, Star, Shield, Clock, TrendingUp, Gift, ShoppingCart, Siren, Calendar, Sparkles, Heart } from "lucide-react";
import { PullToRefresh } from "@/components/PullToRefresh";

const SERVICE_GRID = [
  { id: "ELECTRICIAN", label: "Electrician" },
  { id: "PLUMBER", label: "Plumber" },
  { id: "MECHANIC", label: "Mechanic" },
  { id: "AC_REPAIR", label: "AC Repair" },
  { id: "CARPENTER", label: "Carpenter" },
  { id: "PAINTER", label: "Painter" },
  { id: "CLEANER", label: "Cleaning" },
  { id: "TAXI", label: "Taxi" },
  { id: "PHONE_REPAIR", label: "Phone Repair" },
  { id: "PEST_CONTROL", label: "Pest Control" },
  { id: "DELIVERY", label: "Delivery" },
  { id: "OTHER", label: "More…" },
];

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500/15 text-primary",
  ASSIGNED: "bg-yellow-500/15 text-yellow-400",
  IN_PROGRESS: "bg-orange-500/15 text-orange-400",
  COMPLETED: "bg-green-500/15 text-green-400",
  CANCELLED: "bg-red-500/15 text-red-400",
};

import { ServiceIcon } from "@/components/ServiceIcon";
import { Geolocation } from "@capacitor/geolocation";
import { RatingModal } from "@/components/RatingModal";

export default function ConsumerHome() {
  const [, navigate] = useLocation();
  const [unread, setUnread] = useState(0);
  const [address, setAddress] = useState(() => {
    try {
      const cached = localStorage.getItem("fixit_cache_addresses");
      if (cached) {
        const arr = JSON.parse(cached);
        if (Array.isArray(arr) && arr.length > 0) return arr[0].label || "Muscat, Oman";
      }
    } catch {}
    return "Muscat, Oman";
  });
  const [adIdx, setAdIdx] = useState(0);
  const adTimer = useRef<ReturnType<typeof setInterval>>();

  const { data: jobs = [] } = useQuery({ queryKey: ["myJobs"], queryFn: api.myJobs });
  const { data: ads = [] } = useQuery({ queryKey: ["ads", "HOME"], queryFn: () => api.getAds("HOME") });
  const { data: vendors = [] } = useQuery({
    queryKey: ["nearbyVendors"],
    queryFn: async () => {
      let lat = 23.588;
      let lng = 58.3829;
      try {
        const cachedStr = localStorage.getItem("fixit_cached_location");
        if (cachedStr) {
          const c = JSON.parse(cachedStr);
          lat = c.lat;
          lng = c.lng;
        } else {
          // Do NOT automatically request location here because it causes the app to reload on some platforms.
          // Wait for the user to explicitly tap "Locate Me" or select an address.
          lat = 23.588;
          lng = 58.3829;
        }
      } catch (e) {
        console.warn("Location cache error", e);
      }
      const v = await api.nearbyVendors(lat, lng);
      return Array.isArray(v) ? v.slice(0, 6) : [];
    }
  });

  const [ratingJob, setRatingJob] = useState<any>(null);

  useEffect(() => {
    // Find the first COMPLETED job that hasn't been rated or skipped locally
    const unrated = jobs.find((j: any) => 
      j.status === "COMPLETED" && 
      !localStorage.getItem(`rated_job_${j.job_id}`)
    );
    if (unrated) setRatingJob(unrated);
  }, [jobs]);

  const handleRatingDone = () => {
    if (ratingJob) {
      localStorage.setItem(`rated_job_${ratingJob.job_id}`, "true");
      setRatingJob(null);
    }
  };

  const loadExtra = useCallback(() => {
    swr("notifications", api.notifications, (n) => {
      setUnread(Array.isArray(n) ? n.filter((x: any) => !x.read_at).length : 0);
    }).catch(() => {});
    swr("addresses", api.addresses, (a) => {
      if (Array.isArray(a) && a.length > 0) setAddress(a[0].label || "Muscat, Oman");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem("fixit_guest") && !getToken()) {
      navigate("/auth/user/login");
      return;
    }
    api.registerPushNotifications().catch(() => {});
    loadExtra();
  }, [loadExtra, navigate]);

  // Auto-rotate ads
  useEffect(() => {
    if (ads.length < 2) return;
    adTimer.current = setInterval(() => setAdIdx((i) => (i + 1) % ads.length), 4000);
    return () => clearInterval(adTimer.current);
  }, [ads.length]);

  const activeJobs = jobs.filter((j) => j.status !== "COMPLETED" && j.status !== "CANCELLED");
  const queryClient = useQueryClient();
  const { t } = useI18n();

  return (
    <ConsumerLayout>
      <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries(); loadExtra(); }}>
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground text-white border-b border-primary/20 shadow-sm pt-[env(safe-area-inset-top,2rem)] pb-2 transition-all rounded-b-3xl">
        <div className="flex items-center gap-3 px-5 pt-2 pb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-9 h-9 rounded-full bg-white/20 p-1.5 shadow-sm" alt={t("app.name", "FixIt Now")} />
            <span className="text-xl font-black tracking-tight text-white">{t("app.name", "FixIt").replace(" Now", "")}</span>
          </div>
          <button onClick={() => navigate("/profile/addresses")} className="flex-1 flex flex-col justify-center items-end text-right min-w-0 ml-1">
            <span className="text-[10px] text-white/70 uppercase tracking-widest font-bold">{t("home.location")}</span>
            <div className="flex items-center gap-1 justify-end">
              <MapPin className="w-3.5 h-3.5 text-yellow-300 shrink-0" />
              <span className="text-sm font-black text-white truncate">{address}</span>
            </div>
          </button>
          <button onClick={() => navigate("/notifications")} className="relative w-10 h-10 bg-white/10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors ml-2">
            <Bell className="w-5 h-5 text-white" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-black rounded-full flex items-center justify-center border-2 border-primary shadow-sm">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 pb-2">
          <button
            onClick={() => navigate("/search")}
            className="w-full flex items-center gap-3 h-12 bg-white/20 border border-white/30 rounded-full px-4 text-white text-sm hover:bg-white/30 transition-all shadow-inner"
          >
            <Search className="w-5 h-5 text-white/70" />
            <span className="text-white/80">{t("home.searchPlaceholder")}</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 pb-28">
        {/* ── Ad Banner ── */}
        <div className="relative rounded-[1.5rem] overflow-hidden h-40 shadow-lg border border-border">
          <div className="absolute inset-0 flex items-center justify-between" style={{ background: "#0F172A" }}>
            <img src={adIdx % 2 === 0 ? "/promo_banner_1_1783502085541.png" : "/promo_banner_2_1783502094201.png"} className="w-full h-full object-cover opacity-90 transition-opacity duration-500" alt="Promo" />
          </div>
          {/* Action Overlay */}
          <div className="absolute bottom-3 left-4">
            <button onClick={() => navigate("/upgrade")} className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-full shadow hover:bg-primary/90">
              Upgrade Now
            </button>
          </div>
          {/* Dots */}
          <div className="absolute bottom-4 right-4 flex gap-1.5">
            {[0, 1].map((i) => (
              <button key={i} onClick={() => setAdIdx(i)} className={`h-1.5 rounded-full transition-all ${i === adIdx % 2 ? "w-5 bg-white" : "w-1.5 bg-white/40"}`} />
            ))}
          </div>
        </div>

        {/* ── Active Job Alert ── */}
        {activeJobs.length > 0 && (
          <Link href={activeJobs[0].status === "OPEN" ? `/job/${activeJobs[0].job_id}/bids` : `/order/${activeJobs[0].job_id}`}>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 border border-primary/20 rounded-full p-3.5 cursor-pointer hover:bg-primary/15 transition-colors">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">{t("home.activeJob")}</p>
                <p className="text-sm font-semibold truncate">{activeJobs[0].description?.slice(0, 50) || activeJobs[0].category_id}</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[activeJobs[0].status] || "bg-muted text-muted-foreground"}`}>
                {String(activeJobs[0].status).replace(/_/g, " ")}
              </div>
              <ChevronRight className="w-4 h-4 text-primary" />
            </div>
          </Link>
        )}

        {/* Categories / Services */}
        <div className="mb-8">
          <div className="flex items-center justify-between px-1 mb-4">
            <h2 className="text-lg font-black tracking-tight">{t("home.services")}</h2>
            <button onClick={() => navigate("/categories")} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
              {t("home.viewAll")}
            </button>
          </div>
          <div className="grid grid-cols-4 gap-x-2 gap-y-4">
            {SERVICE_GRID.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(s.id === "OTHER" ? "/categories" : `/post-job?category=${s.id}`)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-[4.2rem] h-[4.2rem] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-105 transition-all shadow-sm">
                  <ServiceIcon id={s.id} className="w-7 h-7 text-primary" />
                </div>
                <span className="text-[10px] font-bold text-center leading-tight px-1 break-words">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Vendors */}
        {vendors.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between px-1 mb-4">
              <h2 className="text-lg font-black tracking-tight">{t("home.topVendors")}</h2>
              <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                {t("home.viewAll")}
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
              {vendors.map((v: any, i: number) => {
                const name = v.display_name || v.full_name || `Pro #${i + 1}`;
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <Link key={v.vendor_id || i} href={`/vendor/${v.vendor_id || v.user_id}`}>
                    <div className="flex-shrink-0 w-44 bg-card border border-border/50 rounded-full p-4 shadow-sm hover:shadow-md cursor-pointer hover:border-primary/40 transition-all">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-xl font-black text-primary mb-3 shadow-inner relative">
                        {v.avatar_url ? <img src={v.avatar_url} className="w-full h-full object-cover rounded-full" /> : initials}
                        {v.is_pro ? (
                          <img src="/goldenverifiedbadgepro.png" className="w-6 h-6 absolute -bottom-1.5 -right-1.5 drop-shadow-md" alt="Pro" />
                        ) : (
                          <img src="/bluetickverifiedbadge.png" className="w-5 h-5 absolute -bottom-1 -right-1 drop-shadow-md" alt="Verified" />
                        )}
                      </div>
                      <p className="text-sm font-black truncate">{name}</p>
                      <p className="text-[11px] font-medium text-muted-foreground truncate">{v.primary_category || "General"}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">{typeof v.rating === "number" ? v.rating.toFixed(1) : "5.0"}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded-md">{v.distance_km ? `${Number(v.distance_km).toFixed(1)}km` : "Nearby"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Power Features Quick Access ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-black">Quick Services</h2>
            <Link href="/favorites"><span className="text-xs font-bold text-primary flex items-center gap-1">Saved Pros <Heart className="w-3 h-3 fill-primary" /></span></Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Parts Store", sub: "30m delivery", icon: <ShoppingCart />, href: "/store", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
              { label: "Home Care", sub: "Regular plans", icon: <Calendar />, href: "/maintenance", bg: "bg-primary/10 text-primary border-primary/20" },
              { label: "Pro Feed", sub: "Before/After", icon: <Sparkles />, href: "/feed", bg: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
            ].map((f) => (
              <Link key={f.label} href={f.href}>
                <div className={`p-3 rounded-full border ${f.bg} flex flex-col items-center text-center cursor-pointer hover:scale-95 transition-all shadow-sm`}>
                  <div className="mb-1 flex justify-center [&>svg]:w-6 [&>svg]:h-6">{f.icon}</div>
                  <p className="text-[11px] font-black leading-tight">{f.label}</p>
                  <p className="text-[9px] opacity-80 mt-0.5 font-semibold">{f.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Trust Badges ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Shield, label: "Secure Pay", sub: "Escrow-protected", color: "text-green-400" },
            { icon: Star, label: "Verified Pros", sub: "ID-checked", color: "text-yellow-400" },
            { icon: Clock, label: "Fast Match", sub: "Avg 8 mins", color: "text-primary" },
          ].map((b) => (
            <div key={b.label} className="bg-card border border-border rounded-full p-3 text-center">
              <b.icon className={`w-5 h-5 ${b.color} mx-auto mb-1`} />
              <p className="text-xs font-bold">{b.label}</p>
              <p className="text-[10px] text-muted-foreground">{b.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Recent Jobs ── */}
        {jobs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black">Recent Jobs</h2>
              <Link href="/my-jobs"><span className="text-xs font-bold text-primary">View all →</span></Link>
            </div>
            <div className="space-y-2">
              {jobs.slice(0, 3).map((job) => (
                <Link key={job.job_id} href={job.status === "OPEN" ? `/job/${job.job_id}/bids` : `/order/${job.job_id}`}>
                  <div className="flex items-center gap-3 bg-card border border-border rounded-full p-3.5 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                      <ServiceIcon id={job.category_id} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {job.tracking_id ? <span className="text-primary/70 font-mono text-[11px] mr-1">{job.tracking_id}</span> : null}
                        {job.description?.slice(0, 48) || job.category_id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold shrink-0 ${STATUS_COLORS[job.status] || "bg-muted text-muted-foreground"}`}>
                      {String(job.status).replace(/_/g, " ")}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Top Vendors ── */}
        {vendors.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black">Top Pros Near You</h2>
              <Link href="/search"><span className="text-xs font-bold text-primary">See all →</span></Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
              {vendors.map((v: any, i: number) => {
                const name = v.display_name || v.full_name || `Pro #${i + 1}`;
                const initials = name.slice(0, 2).toUpperCase();
                return (
                  <Link key={v.vendor_id || i} href={`/vendor/${v.vendor_id || v.user_id}`}>
                    <div className="flex-shrink-0 w-44 bg-card border border-border/50 rounded-full p-4 shadow-sm hover:shadow-md cursor-pointer hover:border-primary/40 transition-all">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-xl font-black text-primary mb-3 shadow-inner relative">
                        {v.avatar_url ? <img src={v.avatar_url} className="w-full h-full object-cover rounded-full" /> : initials}
                        {v.is_pro ? (
                          <img src="/goldenverifiedbadgepro.png" className="w-6 h-6 absolute -bottom-1.5 -right-1.5 drop-shadow-md" alt="Pro" />
                        ) : (
                          <img src="/bluetickverifiedbadge.png" className="w-5 h-5 absolute -bottom-1 -right-1 drop-shadow-md" alt="Verified" />
                        )}
                      </div>
                      <p className="text-sm font-black truncate">{name}</p>
                      <p className="text-[11px] font-medium text-muted-foreground truncate">{v.primary_category || "General"}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded-md">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">{typeof v.rating === "number" ? v.rating.toFixed(1) : "5.0"}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-muted-foreground ml-auto bg-muted px-1.5 py-0.5 rounded-md">{v.distance_km ? `${Number(v.distance_km).toFixed(1)}km` : "Nearby"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Rewards Promo ── */}
        <Link href="/profile/rewards">
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20 rounded-full p-4 cursor-pointer hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Gift className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black">Earn Rewards!</p>
              <p className="text-xs text-muted-foreground">Get 2% cashback on every completed job</p>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </div>
        </Link>

        {/* ── Empty state ── */}
        {jobs.length === 0 && (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="font-black text-lg">Ready to get started?</h3>
              <p className="text-sm text-muted-foreground mt-1">Post your first job and get bids from verified pros in minutes.</p>
            </div>
            <button
              onClick={() => navigate("/post-job")}
              className="px-6 py-3 bg-primary text-white font-bold rounded-full shadow-[0_4px_20px_rgba(27,110,243,0.4)] hover:shadow-[0_4px_30px_rgba(27,110,243,0.6)] transition-all"
            >
              Post a Job
            </button>
          </div>
        )}
      </div>
      </PullToRefresh>

      {ratingJob && (
        <RatingModal
          open={!!ratingJob}
          onOpenChange={(open) => !open && handleRatingDone()}
          jobId={ratingJob.job_id}
          onSuccess={handleRatingDone}
        />
      )}
    </ConsumerLayout>
  );
}
