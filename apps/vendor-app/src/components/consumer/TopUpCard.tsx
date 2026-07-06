/**
 * Wallet top-up card with a visual bonus "ad" (10→11, 20→23, 30→35, 50→55) and
 * PayPal payment with a dev-bypass. In dev the backend credits instantly, so
 * both PayPal (sandbox) and Dev Bypass call /wallet/topup; wire real PayPal
 * capture later behind PAYPAL_* envs.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export function topupBonus(a: number) { return a >= 30 ? 5 : a >= 20 ? 3 : a >= 10 ? 1 : 0; }
const TIERS = [10, 20, 30, 50];

export function TopUpCard({ onCredited }: { onCredited?: () => void }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState(20);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState<"paypal" | "dev" | null>(null);

  const value = custom ? parseFloat(custom) || 0 : amount;
  const bonus = topupBonus(value);

  const pay = async (method: "paypal" | "dev") => {
    if (!value) { toast({ title: "Choose an amount" }); return; }
    setBusy(method);
    try {
      await api.topup(value);
      toast({ title: "Credited Successfully", description: `+${value} OMR${bonus ? ` and +${bonus} bonus` : ""}` });
      onCredited?.();
    } catch (e) { toast({ title: "Top up failed", description: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(null); }
  };

  return (
    <Card className="bg-card border-border shadow-md rounded-2xl overflow-hidden">
      <CardContent className="p-4">
        {/* Bonus ad banner */}
        <div className="bg-primary text-primary-foreground border-b border-border text-white rounded-2xl p-4 mb-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="flex items-center gap-2 mb-1"><Gift className="w-5 h-5" /><p className="font-extrabold">Top-up Bonus</p></div>
          <p className="text-sm text-white/80">Add more, get more -free credit on every top-up.</p>
          <div className="flex gap-2 mt-3">
            {[[10, 11], [20, 23], [30, 35], [50, 55]].map(([pay, get]) => (
              <div key={pay} className="flex-1 bg-white/15 backdrop-blur rounded-xl px-2 py-2 text-center">
                <p className="text-[11px] text-white/70 leading-none">Pay {pay}</p>
                <p className="text-base font-black leading-tight mt-1">{get}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm font-bold mb-2">Choose amount</p>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {TIERS.map((t) => (
            <button key={t} onClick={() => { setAmount(t); setCustom(""); }}
              className={`h-14 rounded-xl border flex flex-col items-center justify-center ${!custom && amount === t ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border"}`}>
              <span className="font-bold text-sm">{t}</span>
              <span className="text-[10px] opacity-80">+{topupBonus(t)} free</span>
            </button>
          ))}
        </div>
        <Input value={custom} onChange={(e) => setCustom(e.target.value.replace(/[^\d.]/g, ""))} placeholder="Or enter a custom amount (OMR)" inputMode="decimal" className="h-11 rounded-xl bg-muted border-border mb-4" />

        <div className="bg-muted rounded-xl px-4 py-3 mb-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">You'll receive</span>
          <span className="font-extrabold">{value + bonus} OMR <span className="text-xs text-success font-bold">(+{bonus} bonus)</span></span>
        </div>

        <Button onClick={() => pay("paypal")} disabled={!!busy} className="w-full h-12 rounded-xl font-bold mb-2" style={{ background: "#0070ba" }}>
          {busy === "paypal" ? "Processing…" : `Pay ${value} OMR with PayPal`}
        </Button>
      </CardContent>
    </Card>
  );
}
