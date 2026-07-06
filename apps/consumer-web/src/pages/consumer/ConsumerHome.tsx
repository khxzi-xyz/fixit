import { useCallback, useEffect, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api, getToken } from "@/lib/api";
import { Bell, MapPin, Search, ChevronRight, Zap, Star, Shield, Clock, TrendingUp, Gift, ShoppingCart, Siren, Calendar, Sparkles, Heart } from "lucide-react";

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

export default function ConsumerHome() {
  const [, navigate] = useLocation();
  const [unread, setUnread] = useState(0);
  const [address, setAddress] = useState("Muscat, Oman");
  const [adIdx, setAdIdx] = useState(0);
  const adTimer = useRef<ReturnType<typeof setInterval>>();

  const { data: jobs = [] } = useQuery({ queryKey: ["myJobs"], queryFn: api.myJobs });
  const { data: ads = [] } = useQuery({ queryKey: ["ads", "HOME"], queryFn: () => api.getAds("HOME") });
  const { data: vendors = [] } = useQuery({
    queryKey: ["nearbyVendors"],
    queryFn: async () => {
      const v = await api.nearbyVendors(23.588, 58.3829);
      return Array.isArray(v) ? v.slice(0, 6) : [];
    }
  });

  const loadExtra = useCallback(async () => {
    try {
      const n = await api.notifications();
      setUnread(Array.isArray(n) ? n.filter((x: any) => !x.read_at).length : 0);
    } catch { /**/ }
    try {
      const a = await api.addresses();
      if (Array.isArray(a) && a.length > 0) setAddress(a[0].label || "Muscat, Oman");
    } catch { /**/ }
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

  return (
    <ConsumerLayout>
      <div className="sticky top-0 z-40 bg-background/90 text-foreground border-b border-border shadow-sm pt-[env(safe-area-inset-top,2rem)] pb-2 backdrop-blur-xl transition-all">
        <div className="flex items-center gap-3 px-5 pt-2 pb-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-9 h-9 rounded-xl bg-primary/10 p-1.5" alt="FixIt Now" />
            <span className="text-xl font-black tracking-tight">FixIt</span>
          </div>
          <button onClick={() => navigate("/profile/addresses")} className="flex-1 flex flex-col justify-center items-end text-right min-w-0 ml-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Location</span>
            <div className="flex items-center gap-1 justify-end">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-sm font-black truncate">{address}</span>
            </div>
          </button>
          <button onClick={() => navigate("/notifications")} className="relative w-10 h-10 bg-muted/50 rounded-2xl flex items-center justify-center hover:bg-muted transition-colors ml-2">
            <Bell className="w-5 h-5 text-foreground" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-black rounded-full flex items-center justify-center border-2 border-background shadow-sm">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="px-5 pb-2">
          <button
            onClick={() => navigate("/search")}
            className="w-full flex items-center gap-3 h-12 bg-muted/50 border border-border rounded-2xl px-4 text-foreground text-sm hover:bg-muted transition-all"
          >
            <Search className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground font-medium flex-1 text-left">Search for a service…</span>
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5 pb-28">
        {/* ── Ad Banner ── */}
        {ads.length > 0 && (
          <div className="relative rounded-2xl overflow-hidden h-32 shadow-lg">
            <div
              className="absolute inset-0 flex items-center justify-between px-5"
              style={{ background: ads[adIdx]?.background_color || "linear-gradient(135deg, #1B6EF3, #0d3a8c)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-white text-base font-black leading-tight">{ads[adIdx]?.title}</p>
                {ads[adIdx]?.subtitle && <p className="text-white/75 text-xs mt-1">{ads[adIdx].subtitle}</p>}
                {ads[adIdx]?.cta_url && (
                  <button
                    onClick={() => { api.trackAdClick(ads[adIdx].ad_id); if (ads[adIdx].cta_url?.startsWith("/")) navigate(ads[adIdx].cta_url); }}
                    className="mt-2 px-3 py-1 bg-white/20 border border-white/30 rounded-xl text-white text-xs font-bold hover:bg-white/30 transition-colors"
                  >
                    {ads[adIdx].cta_label || "Learn More"}
                  </button>
                )}
              </div>
              {ads[adIdx]?.image_url && (
                <img src={ads[adIdx].image_url} className="h-24 w-24 object-contain ml-3" alt="" />
              )}
            </div>
            {/* Dots */}
            {ads.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {ads.map((_, i) => (
                  <button key={i} onClick={() => setAdIdx(i)} className={`h-1.5 rounded-full transition-all ${i === adIdx ? "w-4 bg-white" : "w-1.5 bg-white/40"}`} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Active Job Alert ── */}
        {activeJobs.length > 0 && (
          <Link href={activeJobs[0].status === "OPEN" ? `/job/${activeJobs[0].job_id}/bids` : `/order/${activeJobs[0].job_id}`}>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 border border-primary/20 rounded-2xl p-3.5 cursor-pointer hover:bg-primary/15 transition-colors">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary font-bold">Active Job</p>
                <p className="text-sm font-semibold truncate">{activeJobs[0].description?.slice(0, 50) || activeJobs[0].category_id}</p>
              </div>
              <div className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[activeJobs[0].status] || "bg-muted text-muted-foreground"}`}>
                {String(activeJobs[0].status).replace(/_/g, " ")}
              </div>
              <ChevronRight className="w-4 h-4 text-primary" />
            </div>
          </Link>
        )}

        {/* ── Service Grid ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black">What do you need?</h2>
            <Link href="/post-job"><span className="text-xs font-bold text-primary">See all →</span></Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {SERVICE_GRID.map((s) => (
              <button
                key={s.id}
                onClick={() => navigate(s.id === "OTHER" ? "/post-job" : `/post-job`)}
                className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 active:scale-95 transition-all shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
                  <ServiceIcon id={s.id} className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-center leading-tight text-foreground/90">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

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
                <div className={`p-3 rounded-2xl border ${f.bg} flex flex-col items-center text-center cursor-pointer hover:scale-95 transition-all shadow-sm`}>
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
            <div key={b.label} className="bg-card border border-border rounded-2xl p-3 text-center">
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
                  <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3.5 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                      <ServiceIcon id={job.category_id} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{job.description?.slice(0, 48) || job.category_id}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold shrink-0 ${STATUS_COLORS[job.status] || "bg-muted text-muted-foreground"}`}>
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
                    <div className="flex-shrink-0 w-44 bg-card border border-border/50 rounded-2xl p-4 shadow-sm hover:shadow-md cursor-pointer hover:border-primary/40 transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-xl font-black text-primary mb-3 shadow-inner relative">
                        {v.avatar_url ? <img src={v.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : initials}
                        <img src="/bluetickverifiedbadge.png" className="w-5 h-5 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm" alt="Verified" />
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
          <div className="flex items-center gap-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20 rounded-2xl p-4 cursor-pointer hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
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
              className="px-6 py-3 bg-primary text-white font-bold rounded-2xl shadow-[0_4px_20px_rgba(27,110,243,0.4)] hover:shadow-[0_4px_30px_rgba(27,110,243,0.6)] transition-all"
            >
              Post a Job
            </button>
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
