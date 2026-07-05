import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Wrench, Zap, Snowflake, Sparkles, Hammer, Shield, Paintbrush, Wind, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StickyHeader, SectionHeader, PromoHero, Rail, CategoryTile, ProCard, Stack } from "@/components/consumer/talabat-kit";
import { api, getToken } from "@/lib/api";
import { useTranslated } from "@/lib/useTranslated";

const EMOJIS: Record<string, string> = { 
  "100": "🛠️", "101": "🪠", "102": "❄️", "103": "🔌", "104": "🪚", "105": "🧱", "106": "🪨", "107": "🪟", "108": "🏠", "109": "🚿", "110": "🎨",
  "200": "🚗", "201": "🛠️", "202": "⚡", "203": "🛞", "204": "🚤", "205": "🏗️", "206": "🔋",
  "300": "💻", "301": "📺", "302": "📹", "303": "🌐", "304": "📱", "305": "🖥️", "306": "✨",
  "400": "🚕", "401": "🚕", "402": "🛣️", "403": "✈️", "404": "🏥",
  "500": "🚚", "501": "🛵", "502": "🛋️", "503": "🪝", "504": "💧", "505": "🔥", "506": "🚛", "507": "💩",
  "600": "🧼", "601": "🧹", "602": "🧽", "603": "🛋️", "604": "✨", "605": "🍳",
  "700": "🎓", "701": "✂️", "702": "📚", "703": "🐕", "704": "📷", "705": "📝"
};
const COLORS = ["primary", "accent", "success", "warning"] as const;
const MUSCAT = { lat: 23.588, lng: 58.3829 };

export default function ConsumerHome() {
  const [_, navigate] = useLocation();
  const [cats, setCats] = useState<{ category_id: string; display_name?: string; name_en?: string }[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [address, setAddress] = useState("Muscat, Oman");

  const load = useCallback(async () => {
    try { setCats(await api.categories()); } catch { /**/ }
    try { setJobs(await api.myJobs()); } catch { /**/ }
    try { const v = await api.nearbyVendors(MUSCAT.lat, MUSCAT.lng); setVendors(Array.isArray(v) ? v : []); } catch { /**/ }
    try { const n = await api.notifications(); setUnread(Array.isArray(n) ? n.filter((x: any) => !x.read_at).length : 0); } catch { /**/ }
    try { const a = await api.addresses(); if (Array.isArray(a) && a.length > 0) setAddress(a[0].label || a[0].details || "Muscat, Oman"); } catch { /**/ }
  }, []);

  useEffect(() => {
    if (!sessionStorage.getItem("FixIt Now_guest") && !getToken()) {
      navigate("/auth/user/login");
      return;
    }
    
    // Register Push Notifications
    api.registerPushNotifications().catch(() => {});
    
    load();
  }, [load, navigate]);

  const jobTitles = useTranslated(jobs.slice(0, 3).map((j) => j.description?.slice(0, 44) || j.category_id));

  return (
    <ConsumerLayout>
      <StickyHeader unread={unread} location={address} />

      <Stack>
        {/* Active Orders Widget */}
        {jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').length > 0 && (
          <div className="bg-gradient-to-r from-primary to-accent text-white p-4 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide opacity-80 mb-1">Active Order Status</p>
                <h3 className="text-lg font-extrabold leading-tight truncate max-w-[200px]">
                  {jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED')[0]?.category_id || "Your Order"}
                </h3>
                <p className="text-sm mt-1 opacity-90">{String(jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED')[0]?.status).replace(/_/g, " ")}</p>
              </div>
              <Link href={jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED')[0]?.status === "OPEN" ? `/job/${jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED')[0]?.job_id}/bids` : `/order/${jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED')[0]?.job_id}`}>
                <div className="bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 backdrop-blur-sm">
                  View <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Categories rail */}
        {cats.length > 0 && (
          <div>
            <SectionHeader title="What do you need?" href="/categories" />
            <Rail>
              {cats.slice(0, 12).map((cat, i) => (
                <CategoryTile key={cat.category_id} label={cat.display_name || cat.name_en || "Service"} Icon={EMOJIS[String(cat.category_id)] ?? "✨"} href="/post-job" color={COLORS[i % COLORS.length]} />
              ))}
            </Rail>
          </div>
        )}

        {/* Promo hero */}
        <PromoHero
          subtitle="Triple-Verify Protection"
          title="Post a job, get blind bids in minutes"
          cta="Post a Job"
          href="/post-job"
        />

        {/* Active jobs */}
        {jobs.length > 0 && (
          <div>
            <SectionHeader title="Your jobs" href="/profile" />
            <div className="space-y-3">
              {jobs.slice(0, 3).map((job) => {
                const open = job.status === "OPEN";
                return (
                  <Link key={job.job_id} href={open ? `/job/${job.job_id}/bids` : `/order/${job.job_id}`}>
                    <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0">{String(job.status).replace(/_/g, " ")}</Badge>
                          <span className="text-[11px] text-muted-foreground capitalize">{String(job.urgency).replace("_", " ").toLowerCase()}</span>
                        </div>
                        <p className="font-semibold text-sm truncate">{jobTitles[jobs.indexOf(job)] || job.description?.slice(0, 44) || job.category_id}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Top pros near you */}
        <div>
          <SectionHeader title="Top pros near you" href="/search" />
          {vendors.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">Verified pros in Muscat will appear here.</p>
          ) : (
            <Rail>
              {vendors.slice(0, 8).map((v: any, i: number) => {
                const name = v.display_name || v.full_name || `Pro #${String(v.vendor_id ?? v.user_id ?? i).slice(0, 5)}`;
                return (
                  <div key={v.vendor_id ?? v.user_id ?? i} className="w-[180px] flex-shrink-0">
                    <ProCard
                      name={name}
                      initials={name.slice(0, 2).toUpperCase()}
                      category={v.primary_category ?? v.category_id ?? "General services"}
                      rating={typeof v.rating === "number" ? v.rating : 4.8}
                      jobs={v.jobs_completed ?? v.completed_jobs}
                      eta={v.distance_km ? `${Number(v.distance_km).toFixed(1)} km` : "Nearby"}
                      verified={v.is_verified ?? true}
                      href="/post-job"
                    />
                  </div>
                );
              })}
            </Rail>
          )}
        </div>

        {/* Trust strip */}
        <div className="grid grid-cols-3 gap-2">
          {[{ k: "Secure Pay", v: "Money held safely" }, { k: "Verified Pros", v: "ID-checked" }, { k: "Warranty", v: "On every job" }].map((b) => (
            <div key={b.k} className="bg-card rounded-2xl border border-border shadow-sm p-3 text-center">
              <p className="text-sm font-extrabold text-primary">{b.k}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{b.v}</p>
            </div>
          ))}
        </div>
      </Stack>
    </ConsumerLayout>
  );
}
