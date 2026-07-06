import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api, tokenClaims, setToken, swr } from "@/lib/api";
import {
  ChevronRight, Wallet, Gift, Bell, Shield, Star, LogOut,
  User, MapPin, Settings, Phone, HelpCircle, Megaphone,
  Crown, TrendingUp, Info,
} from "lucide-react";

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
      {badge && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full mr-1">{badge}</span>}
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
  const [wallet, setWallet] = useState<any>(() => getCache("profile:wallet"));
  const [rewards, setRewards] = useState<any>(() => getCache("profile:rewards"));
  const [plan, setPlan] = useState<any>(() => getCache("profile:plan"));
  const [jobStats, setJobStats] = useState(() => {
    const j = getCache("profile:jobs");
    if (Array.isArray(j)) return { completed: j.filter((x: any) => x.status === "COMPLETED").length, total: j.length };
    return { completed: 0, total: 0 };
  });
  const [unread, setUnread] = useState(0);
  const claims = tokenClaims();
  const name = claims?.full_name || "FixIt User";
  const phone = claims?.phone || "";
  const initials = name.slice(0, 2).toUpperCase();
  const avatarUrl = claims?.user_metadata?.avatar_url as string | undefined;

  useEffect(() => {
    // SWR: instantly loads from cache, then refreshes in background — no more dashes!
    swr("profile:wallet", api.wallet, setWallet).catch(() => {});
    swr("profile:rewards", api.myRewards, setRewards).catch(() => {});
    swr("profile:plan", api.billingMe, setPlan).catch(() => {});
    swr("profile:jobs", api.myJobs, (j) => {
      setJobStats({ completed: j.filter((x: any) => x.status === "COMPLETED").length, total: j.length });
    }).catch(() => {});
    swr("profile:notifications", api.notifications, (n) => {
      setUnread(Array.isArray(n) ? n.filter((x: any) => !x.read_at).length : 0);
    }).catch(() => {});
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
      {/* Hero */}
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 flex items-center justify-between mb-4">
          <img src="/logo.png" className="w-8 h-8 rounded-lg" alt="FixIt" />
          <button onClick={() => navigate("/settings")} className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="relative z-10 flex items-center gap-4">
          <button onClick={() => navigate("/profile/edit")} className="relative w-16 h-16 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-lg overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </button>
          <div>
            <h1 className="text-xl font-black text-white">{name}</h1>
            {phone && <p className="text-primary-foreground/70 text-sm">{phone}</p>}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 bg-white/10 rounded-full text-white text-[10px] font-bold border border-white/20">
                Consumer
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 -mt-10 pb-28 space-y-4">
        {/* Active plan banner */}
        {hasPlan && (
          <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black">
                  {plan.plan_id === "ONCE" || plan.is_lifetime ? "Lifetime Premium" : `FixIt ${plan.plan_id}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {plan.is_lifetime ? "Never expires ✨" : `${planDaysLeft} day${planDaysLeft === 1 ? "" : "s"} left · until ${new Date(plan.plan_expires_at).toLocaleDateString()}`}
                </p>
              </div>
              {!plan.is_lifetime && (
                <button onClick={() => navigate("/upgrade")}
                  className="px-3 py-2 bg-amber-500 text-black text-xs font-black rounded-xl shrink-0 hover:bg-amber-400 transition-colors">
                  + Add days
                </button>
              )}
            </div>
            {!plan.is_lifetime && (
              <div className="mt-3 h-1.5 bg-amber-500/15 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (planDaysLeft / 30) * 100)}%` }} />
              </div>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Wallet", value: wallet ? `${Number(wallet.balance ?? 0).toFixed(3)} OMR` : "0.000 OMR", icon: Wallet, href: "/wallet" },
            { label: "Jobs", value: `${jobStats.completed}/${jobStats.total}`, icon: TrendingUp, href: "/my-jobs" },
            { label: "Rewards", value: rewards ? `${Number(rewards.balance ?? 0).toFixed(3)} OMR` : "0.000 OMR", icon: Gift, href: "/profile/rewards" },
          ].map(({ label, value, icon: Icon, href }) => (
            <button key={label} onClick={() => navigate(href)} className="bg-card border border-border rounded-2xl p-3 text-center shadow-sm hover:border-primary/40 hover:bg-slate-50 dark:bg-slate-900 transition-all active:scale-95">
              <Icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-sm font-black">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </button>
          ))}
        </div>

        {/* Account section */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Account</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <MenuRow icon={User} label="My Account" sub="Password, name, delete account" href="/account" />
            <div className="border-t border-border" />
            <MenuRow icon={MapPin} label="My Addresses" sub="Manage saved locations" href="/profile/addresses" />
            <div className="border-t border-border" />
            <MenuRow icon={Bell} label="Notifications" sub={unread > 0 ? `${unread} unread` : "Stay up to date"} href="/notifications" badge={unread > 0 ? String(unread) : undefined} />
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
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <MenuRow icon={Gift} label="Rewards & Cashback" sub="2% back on every job" href="/profile/rewards" badge="2%" />
            <div className="border-t border-border" />
            <MenuRow icon={Crown} label="FixIt Plus" sub={hasPlan ? "Your plan is active ✨" : "Premium membership - zero fees"} href="/upgrade" badge={hasPlan ? "ACTIVE" : "New"} />
            <div className="border-t border-border" />
            <MenuRow icon={Wallet} label="My Wallet" sub="Balance, top-up, history" href="/wallet" />
          </div>
        </div>

        {/* More section */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">More</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <MenuRow icon={Settings} label="Settings" sub="Theme, language, preferences" href="/settings" />
            <div className="border-t border-border" />
            <MenuRow icon={HelpCircle} label="Help & Support" sub="Chat, tickets, FAQ" href="/support" />
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
          className="w-full flex items-center justify-center gap-2 h-12 border border-red-500/30 text-red-400 font-bold rounded-2xl hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
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
    </ConsumerLayout>
  );
}
