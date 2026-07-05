import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Bell, HelpCircle, LogOut, ChevronRight, Sparkles, Wallet, Globe, Camera } from "lucide-react";
import { api, setToken, tokenClaims } from "@/lib/api";

export default function ConsumerProfile() {
  const [, navigate] = useLocation();
  const [claims] = useState(() => tokenClaims());
  const [billing, setBilling] = useState<any>(null);
  const [pfp, setPfp] = useState<string>((claims as any)?.user_metadata?.avatar_url || (claims as any)?.avatar_url || "");

  useEffect(() => {
    api.billingMe().then((b) => setBilling(b)).catch(() => { });
  }, []);

  const name = claims?.full_name || "FixIt Now User";
  const phone = claims?.phone ? claims.phone : "+968 ••• ••••";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const isPlus = billing?.is_lifetime === true || (billing?.pro_expires_at && new Date(billing.pro_expires_at) > new Date());
  const tier = isPlus ? (billing?.plan_id?.replace('_MONTHLY', '')?.replace('_YEARLY', '')?.replace('_ONCE', '') || "PLUS") : "FREE";

  const signOut = () => { setToken(null); navigate("/auth/user/login"); };

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-6 pb-16 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-4">
          <div className="relative group">
            {pfp ? (
              <img src={pfp} className="w-16 h-16 rounded-full object-cover border-2 border-white/20" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur flex items-center justify-center text-2xl font-black">{initials}</div>
            )}
            <input type="file" accept="image/*" className="hidden" id="pfp-upload" onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                const { avatarUrl } = await api.uploadAvatar(e.target.files[0]);
                setPfp(avatarUrl);
              }
            }} />
            <label htmlFor="pfp-upload" className="absolute bottom-0 right-0 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shadow-md">
              <Camera className="w-3 h-3" />
            </label>
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold truncate">{name}</h2>
            <p className="text-sm text-white/70">{phone}</p>
            <Badge className="mt-2 bg-white/15 text-white border-0 text-xs">{isPlus ? `${tier} MEMBER` : "FREE TIER"}</Badge>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-5">
        {!isPlus && (
          <Link href="/upgrade">
            <Card className="bg-card border-primary/20 shadow-md rounded-2xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-primary">FixIt Now Plus</h3>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-[200px]">Zero service fees & priority matching.</p>
                </div>
                <Button size="sm" className="rounded-xl bg-primary text-primary-foreground font-bold">Upgrade</Button>
              </CardContent>
            </Card>
          </Link>
        )}

        <Card className="bg-card border-border shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {[
              { icon: Wallet, label: "My Wallet", href: "/wallet" },
              { icon: Settings, label: "App Settings", href: "/settings" },
              { icon: Globe, label: "Language", href: "/settings" },
              { icon: Bell, label: "Notifications", href: "/notifications" },
              { icon: Shield, label: "Security & Privacy", href: "/settings" },
              { icon: HelpCircle, label: "Help & Support", href: "/support" },
            ].map((item, i) => (
              <Link key={i} href={item.href}>
                <div className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <item.icon className="w-4 h-4" />
                    </div>
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
    </ConsumerLayout>
  );
}
