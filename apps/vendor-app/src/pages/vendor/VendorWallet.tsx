import { useCallback, useEffect, useState } from "react";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ShieldAlert, History, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, type Wallet as WalletT, type Txn } from "@/lib/api";

export default function VendorWallet() {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletT | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setWallet(await api.wallet()); } catch { /**/ }
    try { setTxns(await api.walletTxns()); } catch { /**/ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const balance = wallet?.balance ?? 0;
  const escrow = wallet?.lockedBalance ?? 0;

  const payout = async () => {
    const n = parseFloat(amount) || balance;
    if (!n) { toast({ title: "Nothing to withdraw" }); return; }
    setBusy(true);
    try { await api.requestPayout(n); toast({ title: "Payout requested", description: `${n.toFixed(2)} OMR -admin will approve shortly.` }); await load(); }
    catch (e) { toast({ title: "Payout failed", description: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(false); }
  };

  const payouts = txns.filter((t) => /payout|withdraw/i.test(t.kind));

  const day = new Date().getDay();
  const isPayoutDay = day === 1 || day === 4;
  const nextDay = day < 1 || day > 4 ? "Monday" : day < 4 ? "Thursday" : "Monday";

  return (
    <VendorLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-12 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-extrabold mb-4">Earnings</h1>
        <p className="text-sm font-medium text-white/70 mb-1">Available for payout</p>
        <div className="flex items-baseline gap-2">
          <h2 className="text-5xl font-black">{balance.toFixed(2)}</h2>
          <span className="text-xl text-white/80 font-medium">OMR</span>
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-6">
        <Card className="bg-card border-border shadow-md rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-bold">Request a payout</p>
            {!isPayoutDay && (
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/30 text-warning-foreground text-xs">
                <strong className="text-warning">Settlement window closed.</strong> Withdrawals are processed on <b>Monday</b> &amp; <b>Thursday</b>. Next window: <b>{nextDay}</b>.
              </div>
            )}
            <div className="flex gap-2">
              <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} placeholder={balance.toFixed(2)} inputMode="decimal" className="h-12 w-28 rounded-xl bg-muted" disabled={!isPayoutDay} />
              <Button onClick={payout} disabled={busy || !isPayoutDay} className="flex-1 h-12 rounded-xl font-bold">
                <ArrowDownRight className="w-5 h-5 mr-2" /> {busy ? "Requesting…" : isPayoutDay ? "Withdraw" : "Locked until " + nextDay}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Cash out on Mondays & Thursdays. Leave blank to withdraw your full balance.</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-1">In Escrow</p>
              <div className="flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-primary" /><h3 className="text-xl font-black">{escrow.toFixed(2)} <span className="text-xs text-muted-foreground font-medium">OMR</span></h3></div>
              <p className="text-[10px] text-muted-foreground mt-1">Awaiting warranty clearance</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm rounded-2xl">
            <CardContent className="p-4">
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Strikes</p>
              <div className="flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-success" /><h3 className="text-xl font-black text-success">0/3</h3></div>
              <p className="text-[10px] text-muted-foreground mt-1">Good standing</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="text-base font-extrabold flex items-center gap-2 mb-3"><History className="w-5 h-5" /> Recent payouts</h3>
          <div className="space-y-3">
            {payouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payouts yet -complete jobs to start earning.</p>
            ) : payouts.map((tx) => (
              <div key={tx.txn_id} className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl shadow-sm">
                <div>
                  <p className="font-bold">{Math.abs(tx.amount).toFixed(2)} OMR</p>
                  {tx.note && <p className="text-xs text-muted-foreground">{tx.note}</p>}
                </div>
                <div className="text-right">
                  <Badge className="bg-success/10 text-success border-0 mb-1">{tx.kind.replace(/_/g, " ")}</Badge>
                  <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
