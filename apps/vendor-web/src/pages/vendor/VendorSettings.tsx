import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Moon, Sun, Bell, LogOut, ShieldCheck, User, Edit2, Loader2, MessageSquare, Phone, MapPin, Building2, Star, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api, setToken, tokenClaims } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { PullToRefresh } from "@/components/PullToRefresh";

export default function VendorSettings() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useI18n();
  
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const [notif, setNotif] = useState(() => localStorage.getItem("FixIt Now_notif") !== "0");

  const [sessionUser, setSessionUser] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [mySkills, setMySkills] = useState<any[]>([]);

  const load = async () => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setSessionUser(data.user);
        setEditName(data.user.user_metadata?.full_name || tokenClaims()?.full_name || "");
      }
    });
    api.vendorAnalytics().then(d => {}).catch(() => {});
    api.mySkillTags().then(setMySkills).catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const toggleTheme = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("FixIt Now_theme", v ? "dark" : "light");
  };

  const toggleNotif = (v: boolean) => { setNotif(v); localStorage.setItem("FixIt Now_notif", v ? "1" : "0"); };

  const signOut = () => { setToken(null); sessionStorage.removeItem("FixIt Now_guest"); navigate("/auth/vendor/login"); };

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

  const saveProfile = async () => {
    if (!editName.trim()) return;
    setAvatarUploading(true);
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: editName } });
      if (error) throw error;
      setSessionUser((prev: any) => ({ ...prev, user_metadata: { ...prev?.user_metadata, full_name: editName } }));
      toast({ title: "Profile updated successfully!" });
      setEditingProfile(false);
    } catch (err: any) {
      toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
    } finally {
      setAvatarUploading(false);
    }
  };

  return (
    <VendorLayout>
      <PullToRefresh onRefresh={async () => { await load(); }}>
      <div className="hero-blue text-white px-4 pt-5 pb-8 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/vendor/home")} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-2xl font-extrabold">{t("settings.title", "Shop Settings")}</h1>
        </div>
      </div>

      <div className="px-4 py-5 space-y-6 -mt-6">
      
        {/* Profile Info */}
        <Card className="bg-card border-none shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative group">
                <div className="w-28 h-28 rounded-full border-4 border-primary/20 bg-muted flex items-center justify-center overflow-hidden">
                  {sessionUser?.user_metadata?.avatar_url ? (
                    <img src={sessionUser.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <button onClick={() => fileRef.current?.click()} disabled={avatarUploading} className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  {avatarUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit2 className="w-5 h-5" />}
                </button>
                <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={avatarUploading} />
              </div>
              
              <div className="w-full">
                {editingProfile ? (
                  <div className="flex items-center gap-2">
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-12 bg-muted/50 rounded-xl flex-1 font-bold text-center" />
                    <Button onClick={saveProfile} disabled={avatarUploading} className="h-12 px-6 rounded-xl font-bold shadow-md">{avatarUploading ? "Saving..." : "Save"}</Button>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-2xl font-extrabold">{sessionUser?.user_metadata?.full_name || "Your Shop"}</h2>
                    <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center justify-center gap-1">
                      <Phone className="w-4 h-4" /> {sessionUser?.phone || sessionUser?.email || "No contact info"}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <div className="flex items-center gap-1 bg-warning/10 text-warning px-3 py-1 rounded-full text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-warning" /> 5.0 Rating
                      </div>
                      <div className="flex items-center gap-1 bg-success/10 text-success px-3 py-1 rounded-full text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setEditingProfile(true)} className="mt-4 rounded-full font-bold border-border bg-transparent hover:bg-muted/50 w-full max-w-[200px]">Edit Shop Name</Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Skills */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest px-1">Approved Skills</h2>
          <Card className="bg-card border border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              {mySkills.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No skills registered yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mySkills.map(s => (
                    <div key={s.tag_id} className="bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> {s.categories?.display_name || s.category_id}
                    </div>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full mt-4 h-12 rounded-xl font-bold border-dashed border-2 hover:bg-muted" onClick={() => navigate("/auth/vendor/register")}>
                Add More Skills
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Security & Verification */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest px-1">Security</h2>
          <Card className="bg-card border border-border/50 shadow-sm rounded-2xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/vendor/settings/triple-verify")}>
            <CardContent className="p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-base block">Triple-Verify</span>
                  <span className="text-xs text-muted-foreground">Boost your profile trust score</span>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180" />
            </CardContent>
          </Card>
        </div>

        {/* Support */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest px-1">Vendor Support</h2>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm rounded-2xl cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/support")}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/50 backdrop-blur-sm flex items-center justify-center text-primary shadow-sm">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <h3 className="font-extrabold text-lg text-primary">Live Vendor Support</h3>
                <p className="text-xs font-medium text-primary/70">KYC issues, disputes, or account help</p>
              </div>
              <ChevronLeft className="w-6 h-6 text-primary/50 rotate-180" />
            </CardContent>
          </Card>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-foreground uppercase tracking-widest px-1">App Preferences</h2>
          <Card className="bg-card border border-border/50 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0 divide-y divide-border/50">
              <div className="flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent"><Moon className="w-5 h-5" /></div>
                  <span className="font-bold text-base">Dark Mode</span>
                </div>
                <Switch checked={dark} onCheckedChange={toggleTheme} className="scale-110" />
              </div>
              <div className="flex items-center justify-between p-5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center text-warning"><Bell className="w-5 h-5" /></div>
                  <span className="font-bold text-base">{t("settings.notifications", "Push Notifications")}</span>
                </div>
                <Switch checked={notif} onCheckedChange={toggleNotif} className="scale-110" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legal & Auth */}
        <div className="pt-4 pb-12 space-y-4">
          <div className="flex items-center justify-center gap-4">
            <button className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Privacy Policy</button>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/30"></span>
            <button className="text-xs font-bold text-muted-foreground hover:text-foreground hover:underline">Terms of Service</button>
          </div>
          <Button variant="outline" onClick={signOut} className="w-full h-14 rounded-2xl border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive hover:text-destructive-foreground font-extrabold shadow-sm hover:shadow-md transition-all">
            <LogOut className="w-5 h-5 mr-2" /> {t("profile.logout", "Log Out")}
          </Button>
        </div>

      </div>
      </PullToRefresh>
    </VendorLayout>
  );
}
