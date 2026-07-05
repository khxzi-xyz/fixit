import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ShieldCheck, Bell, HelpCircle, LogOut, ChevronRight, CheckCircle2, Star, Camera } from "lucide-react";
import { api, setToken, tokenClaims } from "@/lib/api";

export default function VendorProfile() {
  const [, navigate] = useLocation();
  const [claims] = useState(() => tokenClaims());
  const [skills, setSkills] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [pfp, setPfp] = useState<string>((claims as any)?.user_metadata?.avatar_url || (claims as any)?.avatar_url || "");

  useEffect(() => {
    api.mySkillTags().then((s) => setSkills(Array.isArray(s) ? s : [])).catch(() => { });
    api.billingMe().then((b) => setBilling(b)).catch(() => { });
    if (claims?.sub) api.vendorReviews(claims.sub).then((r) => setReviews(Array.isArray(r) ? r : [])).catch(() => { });
  }, [claims?.sub]);

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + (r.rating ?? r.rating_stars ?? 0), 0) / reviews.length) : null;

  const name = claims?.full_name || "Your Shop";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const isPro = billing?.is_lifetime === true || (billing?.pro_expires_at && new Date(billing.pro_expires_at) > new Date());
  const tier = isPro ? (billing?.plan_id?.replace('_MONTHLY', '')?.replace('_YEARLY', '')?.replace('_ONCE', '') || "PRO") : "FREE";
  const signOut = () => { setToken(null); navigate("/auth/user/login"); };

  return (
    <VendorLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-16 rounded-b-3xl shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-extrabold">Shop Profile</h1>
          {!isPro && (
            <Link href="/vendor/upgrade">
              <Badge className="bg-warning text-white border-0 font-bold hover:bg-warning">UPGRADE PRO</Badge>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0 w-20 h-20">
            {pfp ? (
              <img src={pfp} className="w-20 h-20 rounded-full object-cover border-2 border-white/20" />
            ) : (
              <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-full flex items-center justify-center font-black text-2xl">{initials}</div>
            )}
            <input type="file" accept="image/*" className="hidden" id="vendor-pfp-upload" onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                const { avatarUrl } = await api.uploadAvatar(e.target.files[0]);
                setPfp(avatarUrl);
              }
            }} />
            <label htmlFor="vendor-pfp-upload" className="absolute bottom-0 right-0 bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center cursor-pointer shadow-md">
              <Camera className="w-4 h-4" />
            </label>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold truncate">{name}</h2>
              {isPro && <ShieldCheck className="w-5 h-5 text-white shrink-0" />}
            </div>
            <div className="flex items-center gap-2 text-sm text-white/80 mt-1">
              <Star className="w-4 h-4 fill-current" /><span className="font-bold">{avgRating != null ? avgRating.toFixed(1) : "—"}</span>
              <span className="text-white/60">· {reviews.length} review{reviews.length === 1 ? "" : "s"} · {tier} tier</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-6">
        <div>
          <h3 className="font-extrabold text-base mb-3">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet -complete jobs to earn verified reviews.</p>
          ) : (
            <div className="space-y-2">
              {reviews.slice(0, 5).map((r: any, i: number) => {
                const stars = r.rating ?? r.rating_stars ?? 0;
                return (
                  <div key={r.review_id ?? i} className="bg-card border border-border rounded-xl shadow-sm p-3">
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= stars ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />)}
                    </div>
                    {(r.body ?? r.comment_text) && <p className="text-sm text-muted-foreground">{r.body ?? r.comment_text}</p>}
                    {r.created_at && <p className="text-[11px] text-muted-foreground mt-1">{new Date(r.created_at).toLocaleDateString()}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h3 className="font-extrabold text-base mb-3">Verified skills</h3>
          <div className="space-y-2">
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills added yet -submit proof during KYC to get verified.</p>
            ) : skills.map((s: any, i: number) => {
              const approved = (s.status ?? "APPROVED").toUpperCase() === "APPROVED";
              return (
                <div key={i} className={`flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-sm ${approved ? "" : "opacity-70"}`}>
                  <span className="font-semibold text-sm">{s.skill_name ?? s.label ?? s.category_id ?? "Skill"}</span>
                  <div className={`flex items-center gap-1 text-xs font-bold ${approved ? "text-success" : "text-warning"}`}>
                    {approved ? <><CheckCircle2 className="w-4 h-4" /> APPROVED</> : "PENDING"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {[
              { icon: Settings, label: "Shop Settings", href: "/vendor/settings" },
              { icon: ShieldCheck, label: "KYC & Documents", href: "/vendor/settings" },
              { icon: Bell, label: "Notifications", href: "/vendor/settings" },
              { icon: HelpCircle, label: "Vendor Support", href: "/vendor/settings" },
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><item.icon className="w-4 h-4" /></div>
                    <span className="font-semibold text-sm">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Button variant="ghost" onClick={signOut} className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl">
          <LogOut className="w-5 h-5 mr-3" /> Sign Out
        </Button>
      </div>
    </VendorLayout>
  );
}
