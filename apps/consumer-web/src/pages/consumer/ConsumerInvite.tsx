import { useEffect, useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { api, getToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Gift, Sparkles, ShieldCheck, Zap, CreditCard, Lock,
  CheckCircle2, ArrowRight, Crown,
} from "lucide-react";

const PERKS = [
  { icon: Zap, text: "Zero service fees for 3 days" },
  { icon: Crown, text: "Priority matching on every job" },
  { icon: ShieldCheck, text: "Extended warranty coverage" },
  { icon: Sparkles, text: "Unlimited AI job rewrites" },
];

/**
 * /invite/:code — referral landing page. Guests are sent to register (the code
 * is kept for post-signup attribution); signed-in new members save a card and
 * start the 3-day free Plus trial.
 */
export default function ConsumerInvite() {
  const [, paramsInvite] = useRoute("/invite/:code");
  const [, paramsR] = useRoute("/r/:code");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const code = (paramsInvite?.code || paramsR?.code || "").toUpperCase();
  const loggedIn = !!getToken();

  const [step, setStep] = useState<"offer" | "card" | "done">("offer");
  const [busy, setBusy] = useState(false);
  const [plan, setPlan] = useState<any>(null);

  // Card form
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");

  useEffect(() => {
    if (code) localStorage.setItem("fixit_ref_code", code);
    if (loggedIn) api.billingMe().then(setPlan).catch(() => {});
  }, [code, loggedIn]);

  const hasActivePlan = useMemo(
    () => plan?.plan_id && (plan?.is_lifetime || (plan?.plan_expires_at && new Date(plan.plan_expires_at) > new Date())),
    [plan],
  );

  const goRegister = () => {
    sessionStorage.setItem("fixit_post_auth", `/invite/${code}`);
    navigate("/auth/user/register");
  };

  const startTrial = async () => {
    const digits = cardNumber.replace(/\D/g, "");
    const [mm, yy] = expiry.split("/").map((s) => parseInt(s?.trim(), 10));
    if (digits.length < 12) { toast({ title: "Enter a valid card number", variant: "destructive" }); return; }
    if (!mm || !yy) { toast({ title: "Enter expiry as MM/YY", variant: "destructive" }); return; }
    setBusy(true);
    try {
      await api.addPaymentMethod({ cardNumber: digits, expMonth: mm, expYear: yy, holderName: holder || undefined, cvv: cvv || undefined });
      await api.startTrial(code);
      localStorage.removeItem("fixit_ref_code");
      setStep("done");
    } catch (e: any) {
      toast({ title: "Couldn't start trial", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      {/* Hero */}
      <div className="relative bg-primary text-primary-foreground border-b border-border px-6 pt-14 pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        <img src="/logo.png" alt="FixIt" className="w-16 h-16 rounded-full mx-auto mb-4 shadow-xl relative z-10" />
        <h1 className="text-2xl font-black text-white relative z-10">You're invited to FixIt Now! 🎉</h1>
        <p className="text-primary-foreground/70 text-sm mt-2 relative z-10">
          A friend shared code <span className="font-black text-white tracking-widest">{code || "…"}</span> with you
        </p>
        <div className="relative z-10 inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white/15 border border-white/25 rounded-full">
          <Gift className="w-4 h-4 text-pink-300" />
          <span className="text-white text-sm font-bold">3-day FREE Plus trial included</span>
        </div>
      </div>

      <div className="relative z-10 px-4 -mt-6 pb-16 max-w-md mx-auto space-y-4">
        {step === "done" ? (
          <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-xl">
            <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-xl font-black">Trial activated! ✨</h2>
            <p className="text-sm text-muted-foreground mt-2">
              You have 3 days of FixIt Plus — zero fees, priority matching and more. No charge today.
            </p>
            <button onClick={() => navigate("/home")} className="mt-6 w-full h-12 bg-primary text-white font-bold rounded-full flex items-center justify-center gap-2">
              Start exploring <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : step === "card" ? (
          <div className="bg-card border border-border rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="font-black text-base">Add a card to start your free trial</h2>
            </div>
            <p className="text-xs text-muted-foreground -mt-2">
              No charge for 3 days. We only save the card brand and last 4 digits — cancel anytime.
            </p>
            <div className="space-y-3">
              <input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCard(e.target.value))}
                placeholder="Card number"
                inputMode="numeric"
                className="w-full h-12 bg-muted/60 border border-border rounded-full px-4 text-base font-semibold tracking-widest outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <input
                  value={expiry}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                  }}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  className="flex-1 h-12 bg-muted/60 border border-border rounded-full px-4 text-base font-semibold outline-none focus:border-primary"
                />
                <input
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="CVV"
                  inputMode="numeric"
                  className="w-24 h-12 bg-muted/60 border border-border rounded-full px-4 text-base font-semibold outline-none focus:border-primary"
                />
              </div>
              <input
                value={holder}
                onChange={(e) => setHolder(e.target.value)}
                placeholder="Name on card (optional)"
                className="w-full h-12 bg-muted/60 border border-border rounded-full px-4 text-base font-semibold outline-none focus:border-primary"
              />
            </div>
            <button onClick={startTrial} disabled={busy}
              className="w-full h-13 py-3.5 bg-primary text-white font-bold rounded-full flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? "Activating…" : <><Lock className="w-4 h-4" /> Start 3-day free trial</>}
            </button>
            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Card details are encrypted. Full number is never stored.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-5 shadow-xl space-y-4">
            <h2 className="font-black text-base">What you get with Plus</h2>
            <div className="space-y-3">
              {PERKS.map((p) => (
                <div key={p.text} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shrink-0">
                    <p.icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold">{p.text}</p>
                </div>
              ))}
            </div>

            {!loggedIn ? (
              <>
                <button onClick={goRegister}
                  className="w-full py-3.5 bg-primary text-white font-bold rounded-full flex items-center justify-center gap-2">
                  Claim with a new account <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => { sessionStorage.setItem("fixit_post_auth", `/invite/${code}`); navigate("/auth/user/login"); }}
                  className="w-full text-center text-sm text-primary font-bold">
                  I already have an account
                </button>
              </>
            ) : hasActivePlan ? (
              <div className="text-center space-y-3">
                <p className="text-sm text-muted-foreground">You already have an active plan — the trial is for new members. Share your own code from the Rewards page!</p>
                <button onClick={() => navigate("/rewards")} className="w-full py-3.5 bg-primary text-white font-bold rounded-full">
                  Open Rewards
                </button>
              </div>
            ) : (
              <button onClick={() => setStep("card")}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-full flex items-center justify-center gap-2">
                Start my free trial <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground px-6">
          Trial converts to nothing automatically — after 3 days you simply return to the Free plan unless you upgrade.
        </p>
      </div>
    </div>
  );
}
