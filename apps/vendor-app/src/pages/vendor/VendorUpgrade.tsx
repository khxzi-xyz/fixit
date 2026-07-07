import { useEffect, useState } from "react";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Star, Zap, Crown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type Billing = "MONTHLY" | "YEARLY" | "ONCE";
type Tier = "PRO" | "ELITE";

const TIERS: Record<Tier, { icon: any; label: string; color: string; perks: string[] }> = {
  PRO: {
    icon: Star,
    label: "Pro",
    color: "text-primary",
    perks: [
      "Priority job feed placement",
      "Verified Pro badge",
      "Advanced analytics dashboard",
      "Unlimited bid tokens",
    ],
  },
  ELITE: {
    icon: Crown,
    label: "Elite",
    color: "text-amber-500",
    perks: [
      "Top of feed -always",
      "Elite gold badge",
      "Dedicated support line",
      "Unlimited bid tokens",
      "Revenue analytics",
      "Featured on homepage",
    ],
  },
};

const PLAN_MAP: Record<Tier, Record<Billing, string>> = {
  PRO: { MONTHLY: "PRO_MONTHLY", YEARLY: "PRO_YEARLY", ONCE: "PRO_YEARLY" },
  ELITE: { MONTHLY: "ELITE_MONTHLY", YEARLY: "ELITE_YEARLY", ONCE: "ELITE_ONCE" },
};

export default function VendorUpgrade() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tier, setTier] = useState<Tier>("PRO");
  const [billing, setBilling] = useState<Billing>("MONTHLY");

  useEffect(() => {
    api.plans().then((p) => setPlans(Array.isArray(p) ? p : [])).catch(() => { });
    api.wallet().then((w) => setBalance(w.balance)).catch(() => { });
    api.me().then((u) => setCurrentPlan({ planId: u?.plan_id, expiresAt: u?.plan_expires_at })).catch(() => { });
  }, []);

  const planId = PLAN_MAP[tier][billing];
  const plan = plans.find((p) => p.plan_id === planId);
  const price = plan?.monthly_fee_omr ?? (tier === "ELITE" ? 7 : 3);
  const enough = balance != null && balance >= Number(price);

  const subscribe = async () => {
    if (!enough) {
      toast({ title: "Top up first", description: `Need ${Number(price).toFixed(3)} OMR in wallet.` });
      return;
    }
    setBusy(true);
    try {
      await api.subscribe(planId);
      setShowSuccess(true);
      setTimeout(() => { setShowSuccess(false); navigate("/vendor/profile"); }, 3500);
    } catch (e) {
      toast({ title: "Couldn't upgrade", description: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
    }
  };

  const Icon = TIERS[tier].icon;

  return (
    <VendorLayout>
      <div className={`text-white px-4 pt-10 pb-16 rounded-b-3xl shadow-md text-center ${tier === "ELITE" ? "bg-gradient-to-br from-amber-500 to-orange-600" : "hero-blue"}`}>
        <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="w-10 h-10 fill-current" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">FixIt Now {TIERS[tier].label}</h1>
        <p className="text-white/80 mt-2 text-sm max-w-xs mx-auto">Stand out, bid more, earn more.</p>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Tier toggle */}
        <div className="flex gap-3">
          {(["PRO", "ELITE"] as Tier[]).map((t) => {
            const TIcon = TIERS[t].icon;
            return (
              <button key={t} onClick={() => setTier(t)}
                className={`flex-1 h-14 rounded-full flex items-center justify-center gap-2 font-bold text-sm border-2 transition-all ${tier === t ? (t === "ELITE" ? "bg-amber-50 border-amber-500 text-amber-600 dark:bg-amber-950" : "bg-primary/10 border-primary text-primary") : "bg-card border-border text-muted-foreground"}`}>
                <TIcon className="w-4 h-4" />
                {TIERS[t].label}
              </button>
            );
          })}
        </div>

        <Card className="bg-card border-border shadow-lg rounded-full overflow-hidden">
          <CardContent className="p-5">
            {currentPlan?.planId && (
              <div className="bg-primary/10 border border-primary/20 rounded-full p-3 mb-4">
                <p className="text-xs font-bold text-primary mb-0.5">Active: {currentPlan.planId}</p>
                {currentPlan.expiresAt && (
                  <p className="text-[10px] text-muted-foreground">Expires {new Date(currentPlan.expiresAt).toLocaleDateString()}</p>
                )}
                <p className="text-[10px] text-primary/70 mt-1">New plan days stack on top.</p>
              </div>
            )}

            {/* Billing cycle */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {(["MONTHLY", "YEARLY", "ONCE"] as Billing[]).map((b) => {
                const label = b === "MONTHLY" ? "Monthly" : b === "YEARLY" ? "Yearly" : "Lifetime";
                const hint = b === "YEARLY" ? "2 mo free" : b === "ONCE" ? "Forever" : "";
                return (
                  <button key={b} onClick={() => setBilling(b)}
                    className={`rounded-full py-2 px-1 text-center border transition-all ${billing === b ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"}`}>
                    <span className="block text-xs font-bold">{label}</span>
                    {hint && <span className="block text-[10px] mt-0.5 font-medium">{hint}</span>}
                  </button>
                );
              })}
            </div>

            {/* Price */}
            <div className="mb-5">
              <h2 className="text-4xl font-black text-foreground">
                {Number(price).toFixed(2)} <span className="text-xl text-muted-foreground font-medium">OMR</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                {billing === "ONCE" ? "one-time · lifetime" : billing === "YEARLY" ? "billed yearly" : "per month"} · tax included
              </p>
              {!currentPlan?.planId && (
                <p className="text-xs text-primary font-semibold mt-1">+3 days free trial included</p>
              )}
            </div>

            {/* Perks */}
            <div className="space-y-3 mb-5">
              {TIERS[tier].perks.map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <CheckCircle2 className={`w-5 h-5 shrink-0 ${tier === "ELITE" ? "text-amber-500" : "text-primary"}`} />
                  <span className="text-sm font-medium">{p}</span>
                </div>
              ))}
            </div>

            {balance != null && (
              <p className="text-center text-xs text-muted-foreground mb-3">
                Wallet: <span className={`font-bold ${enough ? "text-green-600" : "text-destructive"}`}>{balance.toFixed(3)} OMR</span>
              </p>
            )}

            <Button onClick={subscribe} disabled={busy}
              className={`w-full h-14 rounded-full text-base font-bold ${tier === "ELITE" ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}>
              {busy ? "Activating…" : enough ? `Activate ${TIERS[tier].label}` : "Top up to upgrade"}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center pb-6">
          <Link href="/vendor/wallet" className="text-sm text-primary font-semibold underline">Top up wallet</Link>
          <span className="text-muted-foreground mx-2">·</span>
          <Link href="/vendor/profile" className="text-sm text-muted-foreground hover:text-foreground font-medium">Maybe later</Link>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-32 h-32 mb-8 animate-bounce">
            <div className={`absolute inset-0 rounded-full blur-2xl animate-pulse ${tier === "ELITE" ? "bg-amber-400/30" : "bg-primary/20"}`} />
            <Icon className={`w-full h-full relative z-10 fill-current ${tier === "ELITE" ? "text-amber-500" : "text-primary"}`} />
          </div>
          <h2 className="text-4xl font-black text-foreground mb-4 text-center px-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
            You're now {TIERS[tier].label}!
          </h2>
          <p className="text-lg text-muted-foreground font-medium text-center px-8 animate-in slide-in-from-bottom-4 duration-500 delay-200">
            Your premium benefits are now active.<br />
            <span className="text-sm mt-2 block">Go win more jobs.</span>
          </p>
        </div>
      )}
    </VendorLayout>
  );
}
