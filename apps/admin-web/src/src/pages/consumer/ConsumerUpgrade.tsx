import { useEffect, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { TopUpCard } from "@/components/consumer/TopUpCard";

const FALLBACK_PERKS = [
  { icon: CheckCircle2, title: "Zero Service Fees", body: "Save on every job -pay exactly what the pro bids." },
  { icon: Zap, title: "Priority Matching", body: "Your jobs jump to the top of pro feeds instantly." },
  { icon: ShieldCheck, title: "Extended Warranty", body: "Automatic +7 days on all warranties." },
  { icon: Sparkles, title: "Unlimited AI Rewrites", body: "Perfect your job posts for the best bids." },
];

export default function ConsumerUpgrade() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [intervalOption, setIntervalOption] = useState<"WEEKLY" | "MONTHLY" | "YEARLY" | "ONCE">("MONTHLY");
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  const loadWallet = () => api.wallet().then((w) => setBalance(w.balance)).catch(() => { });
  const loadUser = () => api.me().then((u) => setCurrentPlan({ planId: u.plan_id, expiresAt: u.plan_expires_at })).catch(() => { });
  useEffect(() => {
    api.plans().then((p) => setPlans(Array.isArray(p) ? p : [])).catch(() => { });
    loadWallet();
    loadUser();
  }, []);

  const consumerPlans = plans.filter((p) => (p.audience ?? "CONSUMER") === "CONSUMER");
  const targetPlanId = intervalOption === "MONTHLY" ? "PLUS" : intervalOption;
  const consumerPlan = consumerPlans.find((p) => p.plan_id === targetPlanId) ?? plans[0];
  const price = consumerPlan?.monthly_fee_omr ?? 3;
  const planId = consumerPlan?.plan_id ?? "PLUS";
  const enough = balance != null && balance >= Number(price);

  const subscribe = async () => {
    if (!enough) { setShowTopup(true); toast({ title: "Top up first", description: `You need ${Number(price).toFixed(2)} OMR in your wallet.` }); return; }
    setBusy(planId);
    try {
      await api.subscribe(planId);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate("/profile");
      }, 3500);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (/balance|fund|insufficient/i.test(m)) { setShowTopup(true); toast({ title: "Insufficient balance", description: "Top up to continue." }); }
      else toast({ title: "Couldn't upgrade", description: m });
    } finally { setBusy(null); }
  };

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-10 pb-16 rounded-b-3xl shadow-md text-center">
        <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">FixIt Now Plus</h1>
        <p className="text-white/80 mt-2 text-sm max-w-xs mx-auto">Zero fees, priority matching, and peace of mind.</p>
      </div>

      <div className="px-4 -mt-8 space-y-5">
        <Card className="bg-card border-border shadow-lg rounded-2xl relative overflow-hidden mt-4">
          <div className="absolute top-0 right-0 px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-bl-xl">MOST POPULAR</div>
          <CardContent className="p-6">

            {currentPlan?.planId && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-5">
                <p className="text-xs font-bold text-primary mb-1">Your Current Plan: {currentPlan.planId}</p>
                {currentPlan.expiresAt && <p className="text-[10px] text-muted-foreground">Expires: {new Date(currentPlan.expiresAt).toLocaleDateString()}</p>}
                <p className="text-[10px] text-primary/80 mt-1">Purchasing a new plan will stack your active days.</p>
              </div>
            )}

            <div className="grid grid-cols-4 gap-2 mb-5">
              {([["WEEKLY", "Weekly"], ["MONTHLY", "Monthly"], ["YEARLY", "Yearly"], ["ONCE", "Lifetime"]] as const).map(([k, label]) => (
                <button key={k} onClick={() => setIntervalOption(k)}
                  className={`h-11 rounded-xl text-xs font-bold border flex items-center justify-center ${intervalOption === k ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="mb-6">
              <h2 className="text-4xl font-black text-foreground">{Number(price).toFixed(2)} <span className="text-xl text-muted-foreground font-medium">OMR</span></h2>
              <p className="text-sm text-muted-foreground">{intervalOption === "ONCE" ? "one-time · lifetime access" : intervalOption === "YEARLY" ? "billed yearly · cancel anytime" : intervalOption === "WEEKLY" ? "per week · 7 days access" : "per month · cancel anytime"}</p>
            </div>

            <div className="space-y-4 mb-8">
              {FALLBACK_PERKS.map((perk) => (
                <div key={perk.title} className="flex items-start gap-3">
                  <perk.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">{perk.title}</h4>
                    <p className="text-xs text-muted-foreground">{perk.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {balance != null && (
              <p className="text-center text-xs text-muted-foreground mb-2">Wallet balance: <span className={`font-bold ${enough ? "text-success" : "text-destructive"}`}>{balance.toFixed(2)} OMR</span></p>
            )}
            <Button onClick={subscribe} disabled={!!busy} className="w-full h-14 rounded-xl text-lg font-bold">
              {busy ? "Activating…" : enough ? "Pay with Wallet" : "Top up & Upgrade"}
            </Button>
            <button onClick={() => setShowTopup((v) => !v)} className="w-full text-center text-sm text-primary font-semibold mt-3">
              {showTopup ? "Hide top-up" : "Top up on the spot (PayPal / dev)"}
            </button>
          </CardContent>
        </Card>

        {showTopup && <TopUpCard onCredited={loadWallet} />}

        <div className="text-center pb-4">
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground font-medium">No thanks, stay on Free</Link>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-32 h-32 mb-8 animate-bounce">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
            <Sparkles className="w-full h-full text-primary relative z-10" />
          </div>
          <h2 className="text-4xl font-black text-foreground mb-4 text-center px-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
            Payment Successful!
          </h2>
          <p className="text-xl text-muted-foreground font-medium text-center px-8 animate-in slide-in-from-bottom-4 duration-500 delay-200">
            Welcome to FixIt Now {intervalOption === "ONCE" ? "Lifetime" : intervalOption === "WEEKLY" ? "Weekly Pass" : "Plus"}!
            <br /><span className="text-sm mt-2 block">Enjoy your premium benefits.</span>
          </p>
        </div>
      )}
    </ConsumerLayout>
  );
}
