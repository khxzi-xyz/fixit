import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Moon, Sun, Bell, Globe, MapPin, Check, LogOut, UserCog, ShieldCheck, Plus, Trash2, Home, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n, LANGUAGES, COUNTRIES, flagUrl, type Lang } from "@/lib/i18n";
import { api, setToken } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { LocationPickerMap } from "@/components/consumer/LocationPickerMap";

export function SettingsScreen({ variant }: { variant: "consumer" | "vendor" }) {
  const Layout = variant === "vendor" ? VendorLayout : ConsumerLayout;
  const back = variant === "vendor" ? "/vendor/profile" : "/profile";
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, lang, setLang, country, setCountry } = useI18n();

  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [notif, setNotif] = useState(() => localStorage.getItem("FixIt Now_notif") !== "0");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addrLabel, setAddrLabel] = useState("");
  const [addrDetails, setAddrDetails] = useState("");
  const [addrBusy, setAddrBusy] = useState(false);

  const loadAddresses = () => { api.addresses().then((a) => setAddresses(Array.isArray(a) ? a : [])).catch(() => { }); };
  useEffect(() => { loadAddresses(); }, []);

  const [addrLat, setAddrLat] = useState<number | undefined>();
  const [addrLng, setAddrLng] = useState<number | undefined>();

  const addAddress = async () => {
    if (!addrLabel.trim()) { toast({ title: "Add a label (e.g. Home, Office)" }); return; }
    setAddrBusy(true);
    try {
      await api.addAddress(addrLabel.trim(), addrDetails.trim() || undefined, addrLat, addrLng);
      setAddrLabel(""); setAddrDetails(""); setAddrLat(undefined); setAddrLng(undefined); loadAddresses();
      toast({ title: "Address saved" });
    } catch (e) { toast({ title: "Couldn't save", description: e instanceof Error ? e.message : String(e) }); }
    finally { setAddrBusy(false); }
  };

  const removeAddress = async (id: string) => {
    try { await api.deleteAddress(id); loadAddresses(); } catch (e) { toast({ title: "Couldn't delete", description: e instanceof Error ? e.message : String(e) }); }
  };

  const toggleTheme = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("FixIt Now_theme", v ? "dark" : "light");
  };
  const toggleNotif = (v: boolean) => { setNotif(v); localStorage.setItem("FixIt Now_notif", v ? "1" : "0"); };

  const signOut = () => { setToken(null); sessionStorage.removeItem("FixIt Now_guest"); navigate("/auth/user/login"); };

  // Account Linking
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSessionUser(data.user));
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) { toast({ title: "File too big", description: "Max 2MB" }); return; }
    
    setAvatarUploading(true);
    try {
      const { avatarUrl } = await api.uploadAvatar(file);
      setSessionUser((prev: any) => ({ ...prev, user_metadata: { ...prev?.user_metadata, avatar_url: avatarUrl } }));
      toast({ title: "Avatar updated!" });
    } catch (err: any) {
      toast({ title: "Failed to upload avatar", description: err.message, variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };
  const [linkEmail, setLinkEmail] = useState("");
  const [linkPhone, setLinkPhone] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);

  const requestEmailLink = async () => {
    if (!linkEmail.includes("@")) return toast({ title: "Invalid email" });
    setLinkBusy(true);
    const { error } = await supabase.auth.updateUser({ email: linkEmail });
    setLinkBusy(false);
    if (error) toast({ title: "Failed to link", description: error.message });
    else toast({ title: "Verification email sent", description: "Check your inbox to confirm the link." });
  };

  const requestPhoneLink = async () => {
    if (linkPhone.length < 8) return toast({ title: "Invalid phone number" });
    setLinkBusy(true);
    const { error } = await supabase.auth.updateUser({ phone: linkPhone });
    setLinkBusy(false);
    if (error) toast({ title: "Failed to link", description: error.message });
    else toast({ title: "OTP sent", description: "Check your phone for verification code." });
  };

  return (
    <Layout>
      <div className="bg-primary text-primary-foreground border-b border-border text-white px-4 pt-5 pb-5 rounded-b-3xl shadow-md flex items-center gap-3">
        <button onClick={() => navigate(back)}><ChevronLeft className="w-6 h-6" /></button>
        <h1 className="text-xl font-extrabold">Settings</h1>
      </div>

      <div className="px-4 py-5 space-y-6">
      
        {/* Profile Card */}
        <Card className="rounded-full border-none shadow-sm bg-card overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary/10 to-primary/5"></div>
          <CardContent className="pt-0 -mt-10 px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-5 items-start md:items-end mb-6">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-full border-4 border-card bg-muted flex items-center justify-center overflow-hidden">
                  {sessionUser?.user_metadata?.avatar_url ? (
                    <img src={sessionUser.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-sm">
                  {avatarUploading ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={avatarUploading} />
                </label>
              </div>
              <div className="flex-1 pb-1">
                <h2 className="text-xl font-bold">{sessionUser?.user_metadata?.full_name || "User"}</h2>
                <p className="text-sm text-muted-foreground">{sessionUser?.email || sessionUser?.phone || ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <section>
          <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2"><Globe className="w-4 h-4" /> {t("onboarding.chooseLanguage")}</h2>
          <Card className="bg-card border-border rounded-full"><CardContent className="p-2">
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code as Lang)}
                  className={`flex items-center justify-between p-3 rounded-full border transition-colors ${lang === l.code ? "border-primary bg-slate-50 dark:bg-slate-900" : "border-transparent hover:bg-muted"}`}>
                  <div className="text-start"><p className="font-bold text-sm">{l.native}</p><p className="text-[11px] text-muted-foreground">{l.label}</p></div>
                  {lang === l.code && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </CardContent></Card>
        </section>

        {/* Country */}
        <section>
          <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2"><MapPin className="w-4 h-4" /> {t("onboarding.chooseCountry")}</h2>
          <Card className="bg-card border-border rounded-full"><CardContent className="p-2">
            <div className="grid grid-cols-2 gap-2">
              {COUNTRIES.map((c) => (
                <button key={c.code} onClick={() => setCountry(c.code)}
                  className={`flex items-center gap-3 p-3 rounded-full border transition-colors ${country === c.code ? "border-primary bg-slate-50 dark:bg-slate-900" : "border-transparent hover:bg-muted"}`}>
                  <img src={flagUrl(c.code)} className="w-8 h-5 rounded object-cover" alt="" />
                  <span className="font-semibold text-sm truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </CardContent></Card>
        </section>

        {/* Saved addresses */}
        <section>
          <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2"><Home className="w-4 h-4" /> Saved addresses</h2>
          <Card className="bg-card border-border rounded-full"><CardContent className="p-4 space-y-3">
            {addresses.length > 0 && (
              <div className="space-y-2">
                {addresses.map((a) => (
                  <div key={a.address_id} className="flex items-center gap-3 p-3 rounded-full bg-muted">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{a.label}</p>
                      {a.details && <p className="text-[11px] text-muted-foreground truncate">{a.details}</p>}
                    </div>
                    <button onClick={() => removeAddress(a.address_id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-3 pt-3 border-t border-border mt-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Add New Address</h3>
              <div className="h-48 overflow-hidden rounded-full border border-border relative">
                <LocationPickerMap 
                  className="w-full h-full"
                  onLocationChange={(l) => {
                    setAddrLat(l.lat); setAddrLng(l.lng);
                    if (l.address && !addrDetails) setAddrDetails(l.address);
                  }}
                />
              </div>
              <Input value={addrLabel} onChange={(e) => setAddrLabel(e.target.value)} placeholder="Label (Home, Office…)" className="h-11 rounded-full bg-muted border-border" />
              <Input value={addrDetails} onChange={(e) => setAddrDetails(e.target.value)} placeholder="Building / street / notes" className="h-11 rounded-full bg-muted border-border" />
              <Button onClick={addAddress} disabled={addrBusy} className="w-full h-11 rounded-full font-bold bg-primary text-white hover:bg-primary/90"><Plus className="w-4 h-4 mr-2" /> {addrBusy ? "Saving…" : "Save Location"}</Button>
            </div>
          </CardContent></Card>
        </section>

        {/* Account Linking */}
        <section>
          <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2"><UserCog className="w-4 h-4" /> Account & Linking</h2>
          <Card className="bg-card border-border rounded-full"><CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Link Email</p>
              <div className="flex gap-2">
                <Input value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder="hello@example.com" className="h-10 rounded-full flex-1" />
                <Button onClick={requestEmailLink} disabled={linkBusy || !linkEmail} className="h-10 rounded-full font-bold">Verify</Button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Link Phone</p>
              <div className="flex gap-2">
                <Input value={linkPhone} onChange={(e) => setLinkPhone(e.target.value)} placeholder="+968 9123 4567" className="h-10 rounded-full flex-1" />
                <Button onClick={requestPhoneLink} disabled={linkBusy || !linkPhone} className="h-10 rounded-full font-bold">Verify</Button>
              </div>
            </div>
          </CardContent></Card>
        </section>

        {/* Preferences */}
        <section>
          <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide mb-3">Preferences</h2>
          <Card className="bg-card border-border rounded-full"><CardContent className="p-0">
            <Row icon={dark ? Moon : Sun} label="Dark mode" right={<Switch checked={dark} onCheckedChange={toggleTheme} />} />
            <Row icon={Bell} label="Notifications" right={<Switch checked={notif} onCheckedChange={toggleNotif} />} last />
          </CardContent></Card>
        </section>

        {/* Legal */}
        <section>
          <h2 className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Legal</h2>
          <Card className="bg-card border-border rounded-full"><CardContent className="p-0">
            <Row icon={ShieldCheck} label={t("legal.tosHeading")} onClick={() => toast({ title: t("legal.tosHeading"), description: t("legal.intro") })} />
            <Row icon={ShieldCheck} label={t("legal.privacyHeading")} onClick={() => toast({ title: t("legal.privacyHeading"), description: t("legal.intro") })} last />
          </CardContent></Card>
        </section>

        <Button variant="ghost" onClick={signOut} className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-full">
          <LogOut className="w-5 h-5 mr-3" /> Sign Out
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">FixIt Now · v0.1.0</p>
      </div>
    </Layout>
  );
}

function Row({ icon: Icon, label, right, onClick, last }: { icon: any; label: string; right?: React.ReactNode; onClick?: () => void; last?: boolean }) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between p-4 ${last ? "" : "border-b border-border"} ${onClick ? "cursor-pointer hover:bg-muted/50" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center text-muted-foreground"><Icon className="w-5 h-5" /></div>
        <span className="font-semibold text-sm">{label}</span>
      </div>
      {right}
    </div>
  );
}
