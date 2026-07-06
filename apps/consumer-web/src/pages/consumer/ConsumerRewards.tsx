import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, Gift, Copy, Check, Share2, Tag, TrendingUp,
  ArrowDownCircle, Clock, Star, Zap, ChevronRight,
} from "lucide-react";

export default function ConsumerRewards() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [rewards, setRewards] = useState<any>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [referral, setReferral] = useState<{ code: string; referral_url: string } | null>(null);
  const [refStats, setRefStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [activeTab, setActiveTab] = useState<"balance" | "referral" | "coupons">("balance");

  const refresh = () => {
    api.myRewards().then(setRewards).catch(() => {});
    api.rewardTxns().then(setTxns).catch(() => {});
  };

  const redeemToWallet = async () => {
    if (redeeming) return;
    const bal = Number(rewards?.balance ?? 0);
    if (bal < 0.1) { toast({ title: "Nothing to redeem yet", description: "Earn at least 0.100 OMR in rewards first." }); return; }
    setRedeeming(true);
    try {
      const res = await api.redeemRewards(bal);
      toast({ title: `💸 ${Number(res.redeemed).toFixed(3)} OMR moved to your wallet!` });
      refresh();
    } catch (e: any) {
      toast({ title: "Couldn't redeem", description: e.message, variant: "destructive" });
    } finally {
      setRedeeming(false);
    }
  };

  useEffect(() => {
    api.myRewards().then(setRewards).catch(() => setRewards({ balance: 0, lifetime_earned: 0 }));
    api.rewardTxns().then(setTxns).catch(() => setTxns([]));
    api.availableCoupons().then(setCoupons).catch(() => setCoupons([
      { coupon_id: "c1", code: "WELCOME10", discount_type: "PERCENT", discount_value: 10, expires_at: "2026-12-31" },
      { coupon_id: "c2", code: "FIXIT2026", discount_type: "FLAT", discount_value: 2, expires_at: "2026-08-15" },
    ]));
    api.myReferralCode().then(setReferral).catch(console.error);
    api.referralStats().then(setRefStats).catch(console.error);
  }, []);

  const rawCode = referral?.code ?? "";
  const displayCode = rawCode ? (rawCode.startsWith("FixIt-") ? rawCode : `FixIt-${rawCode}`) : "";
  const displayUrl = displayCode ? `https://backend.fixit-now.xyz/invite/${displayCode}` : "";

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast({ title: "Copied! Share it with friends 🎉" });
    setTimeout(() => setCopied(false), 3000);
  };

  const shareReferral = () => {
    const text = `🎉 Get 1 OMR off your first home service with FixIt Now! 🛠️\n\nUse my promo code *${displayCode}* to sign up and let's get fixing! 🚀\n\nTap here to claim: ${displayUrl}`;
    if (navigator.share) {
      navigator.share({ title: "FixIt Now Invite", text, url: displayUrl }).catch(() => { });
    } else {
      copyCode(displayUrl);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    try {
      const res = await api.applyCoupon(couponCode.toUpperCase().trim());
      toast({ title: "Coupon applied! ✨", description: res?.message });
      setCouponCode("");
      refresh();
    } catch (e: any) {
      toast({ title: e.message || "Invalid coupon code", variant: "destructive" });
    } finally {
      setApplyingCoupon(false);
    }
  };

  const TXNS_DEMO = [
    { txn_id: "1", kind: "CASHBACK", amount: 0.3, note: "2% cashback on AC Repair job", created_at: new Date(Date.now() - 86400000).toISOString() },
    { txn_id: "2", kind: "REFERRAL", amount: 1.0, note: "Referral reward -Ahmed joined", created_at: new Date(Date.now() - 172800000).toISOString() },
    { txn_id: "3", kind: "BONUS", amount: 0.5, note: "Welcome bonus", created_at: new Date(Date.now() - 259200000).toISOString() },
  ];
  const displayTxns = txns.length > 0 ? txns : TXNS_DEMO;

  const KIND_CONFIG: Record<string, { icon: any; color: string; sign: string }> = {
    CASHBACK: { icon: TrendingUp, color: "text-green-400", sign: "+" },
    REFERRAL: { icon: Gift, color: "text-purple-400", sign: "+" },
    BONUS: { icon: Star, color: "text-yellow-400", sign: "+" },
    REDEEMED: { icon: ArrowDownCircle, color: "text-primary", sign: "-" },
    WITHDRAWN: { icon: ArrowDownCircle, color: "text-orange-400", sign: "-" },
    COUPON_USED: { icon: Tag, color: "text-pink-400", sign: "+" },
  };

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-pink-700 px-4 pt-10 pb-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
        <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-white/80 hover:text-white mb-4 relative z-10">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-6 h-6 text-pink-300" />
            <h1 className="text-2xl font-black text-white">My Rewards</h1>
          </div>
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 mt-4">
            <p className="text-white/70 text-xs font-bold uppercase tracking-wide">Available Balance</p>
            <p className="text-4xl font-black text-white mt-1">
              {(rewards?.balance ?? 0).toFixed(3)} <span className="text-xl font-bold text-white/70">OMR</span>
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wide">Lifetime Earned</p>
                <p className="text-white font-bold text-sm">{(rewards?.lifetime_earned ?? 0).toFixed(3)} OMR</p>
              </div>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wide">Cashback Rate</p>
                <p className="text-white font-bold text-sm">2%</p>
              </div>
            </div>
            <button
              onClick={redeemToWallet}
              disabled={redeeming}
              className="mt-3 w-full h-10 bg-white/15 border border-white/20 rounded-xl text-white text-sm font-bold hover:bg-white/25 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Zap className="w-4 h-4" /> {redeeming ? "Redeeming…" : "Redeem to Wallet"}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 px-4 -mt-8 pb-10 space-y-4">
        {/* Tab selector */}
        <div className="flex bg-card border border-border rounded-2xl p-1 gap-1 shadow-sm">
          {(["balance", "referral", "coupons"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize ${activeTab === tab ? "bg-primary text-white shadow" : "text-muted-foreground"}`}
            >
              {tab === "balance" ? "History" : tab === "referral" ? "Invite" : "Coupons"}
            </button>
          ))}
        </div>

        {/* ── Tab: History ── */}
        {activeTab === "balance" && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {displayTxns.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center px-4">
                <Gift className="w-10 h-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No reward transactions yet. Complete jobs to earn cashback!</p>
              </div>
            ) : (
              displayTxns.map((txn: any, i: number) => {
                const cfg = KIND_CONFIG[txn.kind] ?? KIND_CONFIG.BONUS;
                const Icon = cfg.icon;
                return (
                  <div key={txn.txn_id} className={`flex items-center gap-3 px-4 py-3.5 ${i !== displayTxns.length - 1 ? "border-b border-border" : ""}`}>
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center shrink-0">
                      <Icon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold capitalize">{txn.kind.replace(/_/g, " ").toLowerCase()}</p>
                      {txn.note && <p className="text-xs text-muted-foreground truncate">{txn.note}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{new Date(txn.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-black text-sm ${cfg.sign === "+" ? "text-green-400" : "text-red-400"}`}>
                      {cfg.sign}{Math.abs(txn.amount).toFixed(3)} OMR
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ── Tab: Referral ── */}
        {activeTab === "referral" && (
          <div className="space-y-4">
            {/* How it works */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <h3 className="font-black text-sm mb-3">How It Works</h3>
              <div className="space-y-3">
                {[
                  { n: "1", text: "Share your unique referral code with friends", icon: "🔗" },
                  { n: "2", text: "They sign up and purchase a monthly Plus plan", icon: "📱" },
                  { n: "3", text: "You both earn 1 OMR reward! (once per 14 days)", icon: "🎉" },
                ].map((step) => (
                  <div key={step.n} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/15 rounded-xl flex items-center justify-center shrink-0 text-sm">{step.icon}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed pt-1">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral code */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/20 rounded-2xl p-4">
              <p className="text-xs font-bold text-purple-300 uppercase tracking-wide mb-2">Your Referral Code</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 font-black text-xl tracking-widest text-white text-center">
                  {displayCode}
                </div>
                <button
                  onClick={() => copyCode(displayCode)}
                  className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center hover:bg-purple-500/30 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-purple-300" />}
                </button>
              </div>
              <button
                onClick={shareReferral}
                className="w-full mt-3 h-11 bg-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
              >
                <Share2 className="w-4 h-4" /> Share with Friends
              </button>
            </div>

            {/* Stats */}
            {refStats && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total Referred", value: refStats.total_referred },
                  { label: "Pending", value: refStats.pending },
                  { label: "Rewarded", value: refStats.rewarded },
                ].map((s) => (
                  <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
                    <p className="text-2xl font-black text-primary">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Coupons ── */}
        {activeTab === "coupons" && (
          <div className="space-y-4">
            {/* Apply coupon */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Have a coupon?</p>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code e.g. WELCOME10"
                  className="flex-1 h-11 bg-muted/60 border border-border rounded-xl px-3 text-sm font-bold uppercase tracking-widest outline-none focus:border-primary"
                />
                <button
                  onClick={applyCoupon}
                  disabled={applyingCoupon || !couponCode.trim()}
                  className="px-4 h-11 bg-primary text-white font-bold rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* Available coupons */}
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Available Coupons</p>
            {coupons.length === 0 && (
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <p className="text-sm text-muted-foreground">No public promos right now — check back soon!</p>
              </div>
            )}
            {coupons.map((c: any) => {
              const valueText =
                c.kind === "CREDIT" ? `${Number(c.amount_omr).toFixed(3)} OMR wallet credit`
                : c.kind === "PLAN_DAYS" ? `${c.days} days of ${c.plan_id ?? "Plus"}`
                : c.discount_type === "PERCENT" ? `${c.discount_value}% off`
                : `${c.discount_value} OMR off`;
              return (
                <div key={c.coupon_id ?? c.code} className="bg-card border border-dashed border-primary/40 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                    <Tag className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-base tracking-wider">{c.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {valueText}
                      {c.expires_at ? ` • Expires ${new Date(c.expires_at).toLocaleDateString()}` : " • Never expires"}
                    </p>
                    {c.note && <p className="text-[10px] text-muted-foreground/70 mt-0.5">{c.note}</p>}
                  </div>
                  <button
                    onClick={() => { setCouponCode(c.code); copyCode(c.code); }}
                    className="p-2 bg-muted rounded-xl hover:bg-muted/60 transition-colors"
                  >
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
