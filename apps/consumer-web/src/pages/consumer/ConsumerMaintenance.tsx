import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench, Calendar, ChevronLeft, CheckCircle2, Crown, ShieldCheck, Sparkles, Clock, ArrowRight,
} from "lucide-react";

export default function ConsumerMaintenance() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.getMaintenancePlans().catch(() => []),
      api.getUserSubscriptions().catch(() => []),
    ]).then(([p, s]) => {
      setPlans(p);
      setSubs(s);
      setLoading(false);
    });
  }, []);

  const handleSubscribe = async (planId: string, title: string) => {
    setSubscribing(planId);
    try {
      const sub = await api.subscribeMaintenance(planId);
      setSubs((prev) => [sub, ...prev]);
      toast({ title: "Subscribed! 🎉", description: `Enrolled in ${title}` });
    } catch (e: any) {
      toast({ title: "Subscription failed", description: e.message, variant: "destructive" });
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <ConsumerLayout>
      {/* Hero */}
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-14 text-white">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-white/80 hover:text-white mb-3">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <div className="flex items-center gap-2 mb-1">
          <Wrench className="w-7 h-7 text-blue-300" />
          <h1 className="text-2xl font-black">Home Maintenance Plans</h1>
        </div>
        <p className="text-primary-foreground/70 text-sm">Automated regular servicing for AC, Plumbing, & Villa Care</p>
      </div>

      <div className="px-4 -mt-6 pb-28 space-y-5 relative z-10">
        {/* Active Subscriptions */}
        {subs.length > 0 && (
          <div className="bg-card border border-border rounded-3xl p-5 shadow-lg space-y-3">
            <h2 className="text-base font-black flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Active Maintenance Schedule
            </h2>
            <div className="space-y-2">
              {subs.map((s) => (
                <div key={s.subscription_id} className="bg-slate-50 dark:bg-slate-900 border border-primary/20 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{s.plan_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" /> Next Visit: <span className="font-bold text-foreground">{s.next_visit_date}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-green-500/15 text-green-400 text-xs font-black rounded-lg">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Plans List */}
        <div className="space-y-4">
          <h2 className="text-base font-black px-1">Available Plans</h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card border border-border rounded-3xl p-5 h-44 animate-pulse" />
              ))}
            </div>
          ) : (
            plans.map((p) => {
              const isSubbed = subs.some((s) => s.plan_id === p.plan_id);
              return (
                <div key={p.plan_id} className="bg-card border border-border rounded-3xl p-5 shadow-md space-y-4 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-black text-lg">{p.title}</h3>
                      <p className="text-xs text-muted-foreground font-semibold">{p.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-primary">{p.price_omr.toFixed(3)}</p>
                      <p className="text-[10px] text-muted-foreground font-bold">OMR / {p.frequency.toLowerCase()}</p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border">
                    {p.perks.map((perk: string) => (
                      <div key={perk} className="flex items-center gap-2 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleSubscribe(p.plan_id, p.title)}
                    disabled={isSubbed || subscribing === p.plan_id}
                    className={`w-full py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                      isSubbed
                        ? "bg-muted text-muted-foreground border border-border"
                        : "bg-primary text-white hover:bg-primary/90 shadow-md"
                    }`}
                  >
                    {isSubbed ? "Enrolled" : subscribing === p.plan_id ? "Enrolling..." : <><span>Enroll in Plan</span> <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ConsumerLayout>
  );
}
