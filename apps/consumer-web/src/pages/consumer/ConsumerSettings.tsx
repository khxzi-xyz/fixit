import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api, setToken } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { setTranslationLang } from "@/lib/realtime-translate";
import {
  ChevronLeft, Sun, Moon, Bell, ChevronRight, Check,
  Volume2, Smartphone, Shield, CreditCard, Headset, Ticket, Fingerprint, LogOut
} from "lucide-react";
import { isFingerprintAvailable, removeSecureToken } from "@/lib/biometrics";

const LANGS = [
  { code: "en", label: "English", native: "English", flag: "🇬🇧" },
  { code: "ar", label: "Arabic", native: "العربية", flag: "🇴🇲" },
  { code: "ur", label: "Urdu", native: "اردو", flag: "🇵🇰" },
  { code: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
];

export default function ConsumerSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [theme, setTheme] = useState(() => localStorage.getItem("fixit_theme") || "dark");
  const [lang, setLang] = useState(() => localStorage.getItem("fixit_lang") || "en");
  const [pushEnabled, setPushEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("fixit_sound") !== "false");
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(() => localStorage.getItem("fixit_bio_enabled") === "true");

  useEffect(() => {
    // Check push permission
    if ("Notification" in window) {
      setPushEnabled(Notification.permission === "granted");
    }
    // Check biometrics
    isFingerprintAvailable().then(setBioAvailable).catch(() => {});
  }, []);

  const toggleTheme = (t: "light" | "dark") => {
    setTheme(t);
    localStorage.setItem("fixit_theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
    api.updateSettings({ theme: t }).catch(() => { });
  };

  const changeLang = (code: string) => {
    setLang(code);
    localStorage.setItem("fixit_lang", code);
    setTranslationLang(code);
    api.updateSettings({ language: code }).catch(() => { });
    document.documentElement.setAttribute("dir", code === "ar" || code === "ur" ? "rtl" : "ltr");
    toast({ title: `Language changed ✅` });
  };

  const enablePush = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setPushEnabled(perm === "granted");
    if (perm === "granted") {
      await api.registerPushNotifications();
      toast({ title: "Push notifications enabled ✅" });
    } else {
      toast({ title: "Permission denied", variant: "destructive" });
    }
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("fixit_sound", String(next));
  };

  const toggleBio = async () => {
    const next = !bioEnabled;
    if (!next) {
      // Disable
      await removeSecureToken();
      localStorage.removeItem("fixit_bio_enabled");
    } else {
      // It must be enabled during login where the token is available
      toast({ title: "Please logout and login again to enable Biometrics", variant: "default" });
      return;
    }
    setBioEnabled(next);
    toast({ title: `Biometric login ${next ? "enabled" : "disabled"} ✅` });
  };

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-14">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-primary-foreground/70 text-sm mt-1">Customize your experience</p>
      </div>

      <div className="relative z-10 px-4 -mt-6 pb-10 space-y-4">
        {/* Appearance */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Appearance</p>
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              {(["light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => toggleTheme(t)}
                  className={`flex items-center gap-3 p-3.5 border-2 rounded-full transition-all ${theme === t ? "border-primary bg-primary/5" : "border-border"}`}
                >
                  {t === "dark" ? <Moon className={`w-4 h-4 ${theme === t ? "text-primary" : "text-muted-foreground"}`} /> : <Sun className={`w-4 h-4 ${theme === t ? "text-primary" : "text-muted-foreground"}`} />}
                  <span className={`text-sm font-bold capitalize ${theme === t ? "text-primary" : "text-muted-foreground"}`}>{t}</span>
                  {theme === t && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Language</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {LANGS.map((l, i) => (
              <button
                key={l.code}
                onClick={() => changeLang(l.code)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors ${i !== LANGS.length - 1 ? "border-b border-border" : ""}`}
              >
                <span className="text-xl">{l.flag}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{l.native}</p>
                </div>
                {lang === l.code && <Check className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Notifications</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Push Notifications</p>
                <p className="text-xs text-muted-foreground">{pushEnabled ? "Enabled -you'll get alerts" : "Disabled -tap to enable"}</p>
              </div>
              {pushEnabled ? (
                <span className="px-2 py-1 bg-green-500/15 text-green-400 text-xs font-bold rounded-lg">ON</span>
              ) : (
                <button onClick={enablePush} className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors">
                  Enable
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center shrink-0">
                <Volume2 className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">In-App Sounds</p>
                <p className="text-xs text-muted-foreground">Notification sounds within the app</p>
              </div>
              <button
                onClick={toggleSound}
                className={`w-12 h-6 rounded-full transition-all relative ${soundEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${soundEnabled ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
            {bioAvailable && (
              <div className="flex items-center gap-3 px-4 py-3.5 border-t border-border">
                <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center shrink-0">
                  <Fingerprint className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Biometric Login</p>
                  <p className="text-xs text-muted-foreground">Sign in quickly and securely</p>
                </div>
                <button
                  onClick={toggleBio}
                  className={`w-12 h-6 rounded-full transition-all relative ${bioEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${bioEnabled ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Payments & Support */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Payments & Support</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {[
              { icon: CreditCard, label: "Payment Methods", sub: "Saved cards for one-tap pay", href: "/settings/payments" },
              { icon: Headset, label: "Support Chat (AI + Agents)", sub: "Instant answers, 24/7", href: "/support/chat" },
              { icon: Ticket, label: "My Support Tickets", sub: "Track open requests", href: "/support" },
            ].map(({ icon: Icon, label, sub, href }, i) => (
              <button
                key={label}
                onClick={() => navigate(href)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors ${i !== 2 ? "border-b border-border" : ""}`}
              >
                <div className="w-10 h-10 border border-border rounded-full flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Legal / Links */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 mb-2">Legal</p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {[
              { icon: Shield, label: "Terms of Service", href: "/tos" },
              { icon: Shield, label: "Privacy Policy", href: "/privacy" },
              { icon: Bell, label: "Notifications", href: "/notifications" },
            ].map(({ icon: Icon, label, href }, i) => (
              <button
                key={label}
                onClick={() => navigate(href)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors ${i !== 2 ? "border-b border-border" : ""}`}
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium text-left">{label}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div className="pt-4">
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              setToken(null);
              localStorage.removeItem("fixit_bio_enabled");
              sessionStorage.removeItem("fixit_guest");
              navigate("/auth/user/login");
            }} 
            className="w-full bg-destructive/10 text-destructive font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </div>
    </ConsumerLayout>
  );
}
