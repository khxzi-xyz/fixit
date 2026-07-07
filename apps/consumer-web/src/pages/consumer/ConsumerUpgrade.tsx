import { useEffect, useState } from "react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Crown, ArrowRight, X } from "lucide-react";
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

const CONFETTI_COLORS = ["#1B6EF3", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6", "#F43F5E"];

/**
 * Temu-style post-purchase show: logo splash → animated perk screens →
 * plan summary → confetti send-off. Auto-advances; user can skip anytime.
 */
function UpgradeSuccessShow({ planLabel, result, onDone }: { planLabel: string; result: any; onDone: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 1600),
      setTimeout(() => setStage(2), 4200),
      setTimeout(() => setStage(3), 6400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const until = result?.until ? new Date(result.until) : (result?.plan?.expires_at ? new Date(result.plan.expires_at) : null);
  const daysLeft = until ? Math.max(1, Math.round((until.getTime() - Date.now()) / 86_400_000)) : null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 bg-gradient-to-b from-slate-900 via-blue-900/50 to-primary overflow-hidden flex flex-col items-center justify-center">
      {/* Confetti removed to prevent animation crashes on weak Android devices */}

      {/* Skip */}
      <button onClick={onDone} className="absolute top-5 right-5 z-10 w-9 h-9 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white">
        <X className="w-4 h-4" />
      </button>

      {/* Stage 0 — logo splash */}
      {stage === 0 && (
        <div className="text-center px-8 transition-opacity duration-500 ease-in-opacity">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <span className="absolute inset-0 rounded-3xl border-2 border-white/40" />
            <span className="absolute inset-0 rounded-3xl border-2 border-white/25" />
            <img src="/logo.png" alt="FixIt" className="relative w-28 h-28 rounded-3xl shadow-2xl" />
          </div>
          <h2 className="text-3xl font-black text-white">Payment Successful!</h2>
          <p className="text-primary-foreground/70 text-sm mt-2">Preparing your premium experience…</p>
        </div>
      )}

      {/* Stage 1 — perk showcase */}
      {stage === 1 && (
        <div className="w-full max-w-sm px-6">
          <p className="text-center text-white/70 text-xs font-bold uppercase tracking-[0.25em] mb-5">
            Unlocked for you
          </p>
          <div className="space-y-3">
            {FALLBACK_PERKS.map((p, i) => (
              <div key={p.title}
                className="flex items-center gap-3 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-3.5 transition-opacity duration-300">
                <div className="w-10 h-10 bg-white/15 rounded-full flex items-center justify-center shrink-0">
                  <p.icon className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{p.title}</p>
                  <p className="text-primary-foreground/70 text-xs">{p.body}</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-400 ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage 2 — plan summary */}
      {stage === 2 && (
        <div className="w-full max-w-sm px-6">
          <div className="bg-white/10 backdrop-blur border border-white/25 rounded-3xl p-6 text-center transition-transform duration-500">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Crown className="w-9 h-9 text-black/80" />
            </div>
            <h3 className="text-white text-2xl font-black">
              {planLabel}
            </h3>
            {daysLeft != null ? (
              <>
                <p className="text-primary-foreground/80 text-sm mt-2">Active for the next</p>
                <p className="text-5xl font-black text-white mt-1">{daysLeft}<span className="text-lg font-bold text-primary-foreground/70 ml-1">days</span></p>
                <p className="text-primary-foreground/70/70 text-xs mt-2">until {until!.toLocaleDateString()}</p>
              </>
            ) : (
              <p className="text-primary-foreground/80 text-sm mt-2">Yours forever ✨</p>
            )}
            {typeof result?.charged === "number" && (
              <p className="text-white/60 text-xs mt-4">Paid from wallet: {Number(result.charged).toFixed(3)} OMR</p>
            )}
          </div>
        </div>
      )}

      {/* Stage 3 — send-off */}
      {stage === 3 && (
        <div className="text-center px-8 transition-opacity duration-500">
          <img src="/logo.png" alt="" className="w-20 h-20 rounded-full mx-auto mb-5 shadow-2xl" />
          <h2 className="text-3xl font-black text-white">Welcome to {planLabel}! 🎉</h2>
          <p className="text-primary-foreground/70 text-sm mt-2 max-w-xs mx-auto">Your perks are live right now. Post a job and feel the difference.</p>
          <button onClick={onDone}
            className="mt-7 px-8 h-13 py-3.5 bg-white text-[#0d1b2a] font-black rounded-full inline-flex items-center gap-2 shadow-xl hover:scale-[1.03] transition-transform">
            Start exploring <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Progress dots */}
      <div className="absolute bottom-8 inset-x-0 flex justify-center gap-2">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${stage === i ? "w-6 bg-white" : "w-1.5 bg-white/30"}`} />
        ))}
      </div>
    </div>
  );
}

export default function ConsumerUpgrade() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [showTopup, setShowTopup] = useState(false);
  const [intervalOption, setIntervalOption] = useState<"WEEKLY" | "MONTHLY" | "YEARLY" | "ONCE">("MONTHLY");
  const [successResult, setSuccessResult] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);

  const loadWallet = () => api.wallet().then((w) => setBalance(w.balance)).catch(() => { });
  const loadUser = () => api.me().then((u) => setCurrentPlan({ planId: u.plan_id, isLifetime: u.is_lifetime || u.plan_id === "ONCE", expiresAt: u.plan_expires_at })).catch(() => { });
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
  const isAlreadyLifetime = !!currentPlan?.isLifetime;

  const subscribe = async () => {
    if (isAlreadyLifetime) {
      toast({ title: "You are a Lifetime Member! ✨", description: "You already have permanent access to all benefits." });
      return;
    }
    if (!enough) { setShowTopup(true); toast({ title: "Top up first", description: `You need ${Number(price).toFixed(2)} OMR in your wallet.` }); return; }
    setBusy(planId);
    try {
      const res = await api.subscribe(planId);
      setSuccessResult(res);
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      if (/balance|fund|insufficient/i.test(m)) { setShowTopup(true); toast({ title: "Insufficient balance", description: "Top up to continue." }); }
      else toast({ title: "Couldn't upgrade", description: m });
    } finally { setBusy(null); }
  };

  return (
    <ConsumerLayout>
      <div className="bg-primary text-primary-foreground border-b border-border text-white px-4 pt-10 pb-16 rounded-b-3xl shadow-md text-center">
        <div className="w-20 h-20 bg-white/15 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="w-10 h-10 text-yellow-300" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">FixIt Now Plus</h1>
        <p className="text-white/80 mt-2 text-sm max-w-xs mx-auto">Zero fees, priority matching, and 2% cashback.</p>
      </div>

      <div className="px-4 mt-6 space-y-5">
        <Card className="bg-card border-border shadow-lg rounded-full relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-bl-xl">
            {isAlreadyLifetime ? "LIFETIME ACTIVE" : "MOST POPULAR"}
          </div>
          <CardContent className="p-6">

            {isAlreadyLifetime ? (
              <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-500/40 rounded-full p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/30 rounded-full flex items-center justify-center text-amber-400">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-foreground">You Have Lifetime Membership! 🎉</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Your account has permanent access to all Pro benefits below.</p>
                  </div>
                </div>
              </div>
            ) : currentPlan?.planId && (
              <div className="bg-slate-100 dark:bg-slate-800 border border-primary/20 rounded-full p-3 mb-5">
                <p className="text-xs font-bold text-primary mb-1">Your Current Plan: {currentPlan.planId}</p>
                {currentPlan.expiresAt && <p className="text-[10px] text-muted-foreground">Expires: {new Date(currentPlan.expiresAt).toLocaleDateString()}</p>}
                <p className="text-[10px] text-primary/80 mt-1">Purchasing a new plan will stack your active days.</p>
              </div>
            )}

            {!isAlreadyLifetime && (
              <div className="grid grid-cols-4 gap-2 mb-5">
                {([["WEEKLY", "Weekly"], ["MONTHLY", "Monthly"], ["YEARLY", "Yearly"], ["ONCE", "Lifetime"]] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setIntervalOption(k)}
                    className={`h-11 rounded-full text-xs font-bold border flex items-center justify-center ${intervalOption === k ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-muted-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {!isAlreadyLifetime && (
              <div className="mb-6">
                <h2 className="text-4xl font-black text-foreground">{Number(price).toFixed(2)} <span className="text-xl text-muted-foreground font-medium">OMR</span></h2>
                <p className="text-sm text-muted-foreground">{intervalOption === "ONCE" ? "one-time · lifetime access" : intervalOption === "YEARLY" ? "billed yearly · cancel anytime" : intervalOption === "WEEKLY" ? "per week · 7 days access" : "per month · cancel anytime"}</p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isAlreadyLifetime ? "Your Active Benefits" : "Included Benefits"}</p>
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

            {isAlreadyLifetime ? (
              <Button disabled className="w-full h-14 rounded-full text-base font-bold bg-amber-500/20 text-amber-500 border border-amber-500/40 opacity-100">
                <CheckCircle2 className="w-5 h-5 mr-2" /> Lifetime Plan Active
              </Button>
            ) : (
              <>
                {balance != null && (
                  <p className="text-center text-xs text-muted-foreground mb-2">Wallet balance: <span className={`font-bold ${enough ? "text-success" : "text-destructive"}`}>{balance.toFixed(2)} OMR</span></p>
                )}
                <Button onClick={subscribe} disabled={!!busy} className="w-full h-14 rounded-full text-lg font-bold">
                  {busy ? "Activating…" : enough ? "Pay with Wallet" : "Top up & Upgrade"}
                </Button>
                <button onClick={() => setShowTopup((v) => !v)} className="w-full text-center text-sm text-primary font-semibold mt-3">
                  {showTopup ? "Hide top-up" : "Top up on the spot (PayPal / dev)"}
                </button>
              </>
            )}
          </CardContent>
        </Card>

        {showTopup && <TopUpCard onCredited={loadWallet} />}

        <div className="text-center pb-4">
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground font-medium">No thanks, stay on Free</Link>
        </div>
      </div>

      {successResult && (
        <UpgradeSuccessShow
          planLabel={intervalOption === "ONCE" ? "Lifetime Premium" : intervalOption === "WEEKLY" ? "Weekly Pass" : intervalOption === "YEARLY" ? "Yearly Plus" : "FixIt Plus"}
          result={successResult}
          onDone={() => { setSuccessResult(null); navigate("/profile"); }}
        />
      )}
    </ConsumerLayout>
  );
}
