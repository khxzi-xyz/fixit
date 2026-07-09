import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api, tokenClaims, setToken, swr } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { PullToRefresh } from "@/components/PullToRefresh";
import {
  ChevronRight, Wallet, Gift, Bell, Shield, Star, LogOut,
  User, MapPin, Settings, Phone, HelpCircle, Megaphone,
  Crown, TrendingUp, Info, Eye, Activity, Map, History, BadgeCheck
} from "lucide-react";
import { ServiceIcon } from "@/components/ServiceIcon";

function MenuRow({ icon: Icon, label, sub, href, danger, badge }: { icon: any; label: string; sub?: string; href: string; danger?: boolean; badge?: string }) {
  const [, navigate] = useLocation();
  return (
    <button
      onClick={() => navigate(href)}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-red-500/10" : "bg-primary/10"}`}>
        <Icon className={`w-5 h-5 ${danger ? "text-red-400" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-red-400" : ""}`}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      {badge && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-xl mr-1">{badge}</span>}
      <ChevronRight className={`w-4 h-4 shrink-0 ${danger ? "text-red-300" : "text-muted-foreground"}`} />
    </button>
  );
}

function getCache(key: string) {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(`fixit_cache_${key}`) || "null"); } catch { return null; }
}

export default function ConsumerProfile() {
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const [wallet, setWallet] = useState<any>(() => getCache("profile:wallet"));
  const [rewards, setRewards] = useState<any>(() => getCache("profile:rewards"));
  const [plan, setPlan] = useState<any>(() => getCache("profile:plan"));
  const [jobStats, setJobStats] = useState(() => {
    const j = getCache("profile:jobs");
    if (Array.isArray(j)) return { completed: j.filter((x: any) => x.status === "COMPLETED").length, total: j.length };
    return { completed: 0, total: 0 };
  });
  const [activeJob, setActiveJob] = useState<any>(() => {
    const j = getCache("profile:jobs");
    if (Array.isArray(j)) return j.find((x: any) => ["MATCHING", "ACCEPTED", "TRAVELING", "ON_SITE", "WARRANTY", "PARTS_PENDING"].includes(x.status)) || null;
    return null;
  });
  const [unread, setUnread] = useState(0);
  const claims = tokenClaims();
  const name = claims?.full_name || "FixIt User";
  const phone = claims?.phone || "";
  const initials = name.slice(0, 2).toUpperCase();
  const avatarUrl = claims?.user_metadata?.avatar_url as string | undefined;

  const loadData = async () => {
    await Promise.allSettled([
      swr("profile:wallet", api.wallet, setWallet),
      swr("profile:rewards", api.myRewards, setRewards),
      swr("profile:plan", api.billingMe, setPlan),
      swr("profile:jobs", api.myJobs, (j) => {
        setJobStats({ completed: j.filter((x: any) => x.status === "COMPLETED").length, total: j.length });
        const active = j.find((x: any) => ["MATCHING", "ACCEPTED", "TRAVELING", "ON_SITE", "WARRANTY", "PARTS_PENDING"].includes(x.status));
        setActiveJob(active || null);
      }),
      swr("profile:notifications", api.notifications, (n) => {
        setUnread(Array.isArray(n) ? n.filter((x: any) => !x.read_at).length : 0);
      })
    ]);
  };

  useEffect(() => {
    loadData();
  }, []);

  const planDaysLeft = plan?.plan_expires_at
    ? Math.max(0, Math.ceil((new Date(plan.plan_expires_at).getTime() - Date.now()) / 86_400_000))
    : 0;
  const hasPlan = !!plan?.plan_id && (plan?.is_lifetime || planDaysLeft > 0);

  const logout = () => {
    setToken(null);
    navigate("/auth/user/login");
  };

  return (
    <ConsumerLayout>
      <PullToRefresh onRefresh={async () => { await loadData(); }}>
      {/* Hero */}
      <div className="relative bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-20 overflow-hidden rounded-b-3xl">
        <img src="/consumer_profile_banner.png" className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" alt="" />
        <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
        
        <div className="relative z-10 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" className="w-11 h-11 rounded-xl bg-white/20 p-1 shadow-sm" alt={t("app.name", "FixIt Now")} />
            <span className="text-2xl font-black text-white tracking-tight">{t("app.name", "FixIt Now")}</span>
          </div>
          <button onClick={() => navigate("/settings")} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative">
            <button onClick={() => navigate("/profile/edit")} className="relative w-16 h-16 rounded-xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>
            {hasPlan ? (
              <div className="absolute -bottom-1 -right-1 rounded-xl shadow-sm drop-shadow-md">
                <BadgeCheck className="w-6 h-6 fill-amber-400 text-white" />
              </div>
            ) : null}
          </div>
          <div>
            <h1 className="text-xl font-black text-white">{name}</h1>
            {phone && <p className="text-primary-foreground/70 text-sm">{phone}</p>}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 bg-white/10 rounded-xl text-white text-[10px] font-bold border border-white/20">
                Consumer
              </span>
              <button 
                onClick={() => navigate(`/profile/${claims?.id || 'me'}`)} 
                className="flex items-center gap-1 px-2 py-0.5 bg-white/10 hover:bg-white/20 transition-colors rounded-xl text-white text-[10px] font-bold border border-white/20"
              >
                <Eye className="w-3 h-3" /> {t("profile.viewPublic")}
              </button>
            </div>
          </div>
        </div>

        {/* Active plan banner in Header */}
        {hasPlan && (
          <div className="relative z-10 mt-6 overflow-hidden rounded-xl p-4 shadow-xl border border-amber-300/50">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 bg-[length:200%_auto] animate-gradient" />
            <div className="absolute inset-0 bg-[url('/fixit_plus_banner.png')] bg-cover bg-center mix-blend-overlay opacity-40" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                <Crown className="w-6 h-6 text-yellow-900 drop-shadow-sm" />
              </div>
              <div className="flex-1 min-w-0 text-yellow-950">
                <p className="text-sm font-black drop-shadow-sm">
                  {plan.plan_id === "ONCE" || plan.is_lifetime ? "Lifetime Premium" : `FixIt ${plan.plan_id}`}
                </p>
                <p className="text-xs font-bold opacity-80">
                  {plan.is_lifetime ? "∞ Unlimited days" : `${planDaysLeft} day${planDaysLeft === 1 ? "" : "s"} left · until ${new Date(plan.plan_expires_at).toLocaleDateString()}`}
                </p>
              </div>
              {!plan.is_lifetime && (
                <button onClick={() => navigate("/upgrade")}
                  className="px-4 py-2 bg-yellow-950 text-amber-400 text-xs font-black rounded-xl shrink-0 hover:bg-yellow-900 transition-colors shadow-lg active:scale-95">
                  + Add days
                </button>
              )}
            </div>
            {!plan.is_lifetime && (
              <div className="relative mt-3 h-1.5 bg-yellow-950/20 rounded-xl overflow-hidden shadow-inner">
                <div className="h-full bg-yellow-950 rounded-xl transition-all"
                  style={{ width: `${Math.min(100, (planDaysLeft / 30) * 100)}%` }} />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative z-10 px-4 -mt-10 pb-28 space-y-4">

        {/* Active Job Tracker */}
        {activeJob && (
          <div className="bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-blue-500/15 border border-blue-500/30 rounded-xl p-4 shadow-sm relative overflow-hidden cursor-pointer" onClick={() => navigate(`/tracking/${activeJob.id}`)}>
            <div className="absolute top-0 right-0 p-2">
              <div className="w-2 h-2 rounded-xl bg-blue-500 animate-ping absolute" />
              <div className="w-2 h-2 rounded-xl bg-blue-500 relative" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0 p-2 shadow-inner">
                <ServiceIcon categoryId={activeJob.category_id || activeJob.category || "GENERAL"} className="w-full h-full object-contain drop-shadow-sm" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-500 font-bold uppercase tracking-wider">Active Job</p>
                <p className="text-sm font-black truncate">{activeJob.category || "Service Request"}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{String(activeJob.status).replace(/_/g, " ").toLowerCase()}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-blue-500/50" />
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("wallet.myWallet", "Wallet"), value: wallet ? `${Number(wallet.balance ?? 0).toFixed(3)} OMR` : "0.000 OMR", icon: Wallet, href: "/wallet" },
            { label: t("profile.completedJobs", "Jobs"), value: `${jobStats.completed}/${jobStats.total}`, icon: TrendingUp, href: "/my-jobs" },
            { label: t("rewards.myRewards", "Rewards"), value: rewards ? `${Number(rewards.balance ?? 0).toFixed(3)} OMR` : "0.000 OMR", icon: Gift, href: "/profile/rewards" },
          ].map(({ label, value, icon: Icon, href }) => (
            <button key={label} onClick={() => navigate(href)} className="bg-card border border-border rounded-xl p-3 text-center shadow-sm hover:border-primary/40 hover:bg-slate-50 dark:bg-slate-900 transition-all active:scale-95">
              <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-sm font-black">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </button>
          ))}
        </div>

        {/* Account section */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Account</p>
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <MenuRow icon={User} label={t("profile.editProfile", "Edit Profile")} sub="Password, name, delete account" href="/account" />
            <div className="border-t border-border" />
            <MenuRow icon={MapPin} label={t("home.location", "Saved Addresses")} sub="Manage saved locations" href="/profile/addresses" />
            <div className="border-t border-border" />
            <MenuRow icon={Bell} label={t("settings.notifications", "Notifications")} sub={unread > 0 ? `${unread} unread` : "Stay up to date"} href="/notifications" badge={unread > 0 ? String(unread) : undefined} />
            <div className="border-t border-border" />
            <button
              onClick={async () => {
                const token = localStorage.getItem("fixit_fcm_token");
                if (token) {
                  try {
                    await navigator.clipboard.writeText(token);
                    alert("FCM Device Token copied to clipboard!");
                  } catch(e) {
                    alert("Token: " + token);
                  }
                } else {
                  alert("No push token found. Ensure you granted notification permissions on startup!");
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">Copy Device Push Token</p>
                <p className="text-xs text-muted-foreground">To test sending Firebase notifications</p>
              </div>
            </button>
          </div>
        </div>

        {/* Perks section */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Perks</p>
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <MenuRow icon={Gift} label={t("rewards.myRewards", "Rewards")} sub="2% back on every job" href="/profile/rewards" badge="2%" />
            <div className="border-t border-border" />
            <MenuRow icon={Crown} label="FixIt Plus" sub={hasPlan ? "Your plan is active ✨" : "Premium membership - zero fees"} href="/upgrade" badge={hasPlan ? "ACTIVE" : "New"} />
            <div className="border-t border-border" />
            <MenuRow icon={Wallet} label={t("wallet.myWallet", "My Wallet")} sub="Balance, top-up, history" href="/wallet" />
          </div>
        </div>

        {/* More section */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">More</p>
          <div className="bg-card border border-border rounded-[1.5rem] overflow-hidden shadow-sm mb-4 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => navigate("/support")}>
            <img src="/support_banner_1783502104631.png" className="w-full h-28 object-cover" alt="24/7 Support" />
          </div>
          <div className="bg-card border border-border rounded-[1.5rem] overflow-hidden shadow-sm">
            <MenuRow icon={Settings} label={t("settings.title", "Settings")} sub="Theme, language, preferences" href="/settings" />
            <div className="border-t border-border" />
            <MenuRow icon={HelpCircle} label={t("chats.support", "Help & Support")} sub="Chat, tickets, FAQ" href="/support" />
            <div className="border-t border-border" />
            <MenuRow icon={Megaphone} label="Advertise with Us" sub="Reach thousands of users" href="/advertise" />
            <div className="border-t border-border" />
            <MenuRow icon={Info} label="About FixIt Now" sub="Our story, mission, team" href="/about" />
            <div className="border-t border-border" />
            <MenuRow icon={Shield} label="Terms & Privacy" sub="Legal information" href="/tos" />
            <div className="border-t border-border" />
            <button
              onClick={() => {
                const msg = encodeURIComponent(`Hi! I need help with FixIt Now. My name is ${name}${phone ? `, phone: ${phone}` : ""}.`);
                window.open(`https://wa.me/96895956361?text=${msg}`, "_blank");
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">WhatsApp Support</p>
                <p className="text-xs text-muted-foreground">Chat with us · fixit-now.xyz</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 h-12 border border-red-500/30 text-red-400 font-bold rounded-xl hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> {t("profile.logout", "Sign Out")}
        </button>

        {/* Footer links */}
        <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60">
          <button onClick={() => navigate("/tos")} className="hover:text-primary">Terms</button>
          <span>·</span>
          <button onClick={() => navigate("/privacy")} className="hover:text-primary">Privacy</button>
          <span>·</span>
          <span>support@fixit-now.xyz</span>
          <span>·</span>
          <span>v1.0.0</span>
        </div>
      </div>
      </PullToRefresh>
    </ConsumerLayout>
  );
}
