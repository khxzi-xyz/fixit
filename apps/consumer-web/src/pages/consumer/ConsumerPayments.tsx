import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, CreditCard, Plus, Trash2, Lock, Star } from "lucide-react";

const BRAND_STYLE: Record<string, string> = {
  VISA: "from-blue-600 to-blue-800",
  MASTERCARD: "from-orange-500 to-red-600",
  AMEX: "from-teal-500 to-cyan-700",
  CARD: "from-slate-600 to-slate-800",
};

/** /settings/payments — saved cards used for one-tap payments and free trials. */
export default function ConsumerPayments() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [cards, setCards] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [holder, setHolder] = useState("");

  const load = () => api.paymentMethods().then(setCards).catch(() => setCards([]));
  useEffect(() => { load(); }, []);

  const addCard = async () => {
    const digits = cardNumber.replace(/\D/g, "");
    const [mm, yy] = expiry.split("/").map((s) => parseInt(s?.trim(), 10));
    if (digits.length < 12) { toast({ title: "Enter a valid card number", variant: "destructive" }); return; }
    if (!mm || !yy) { toast({ title: "Enter expiry as MM/YY", variant: "destructive" }); return; }
    setBusy(true);
    try {
      await api.addPaymentMethod({ cardNumber: digits, expMonth: mm, expYear: yy, holderName: holder || undefined, cvv: cvv || undefined });
      toast({ title: "Card saved ✅" });
      setCardNumber(""); setExpiry(""); setCvv(""); setHolder("");
      setShowForm(false);
      load();
    } catch (e: any) {
      toast({ title: "Couldn't save card", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const removeCard = async (id: string) => {
    try {
      await api.deletePaymentMethod(id);
      setCards((c) => c.filter((x) => x.pm_id !== id));
      toast({ title: "Card removed" });
    } catch (e: any) {
      toast({ title: "Couldn't remove card", description: e.message, variant: "destructive" });
    }
  };

  return (
    <ConsumerLayout>
      <div className="bg-gradient-to-br from-[#0d1b2a] via-[#1b3d6e] to-[#1B6EF3] px-4 pt-10 pb-14">
        <button onClick={() => navigate("/settings")} className="flex items-center gap-2 text-white/80 hover:text-white mb-4">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        <h1 className="text-2xl font-black text-white">Payment Methods</h1>
        <p className="text-blue-200 text-sm mt-1">Saved cards for one-tap payments & trials</p>
      </div>

      <div className="relative z-10 px-4 -mt-6 pb-10 space-y-4">
        {cards.length === 0 && !showForm && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center shadow-sm">
            <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No saved cards yet.</p>
          </div>
        )}

        {cards.map((c) => (
          <div key={c.pm_id} className={`relative bg-gradient-to-br ${BRAND_STYLE[c.brand] ?? BRAND_STYLE.CARD} rounded-2xl p-5 text-white shadow-lg overflow-hidden`}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 80% 10%, white 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
            <div className="relative z-10 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest opacity-80">{c.brand}</p>
                <p className="text-xl font-black tracking-[0.3em] mt-3">•••• {c.last4}</p>
                <p className="text-xs opacity-80 mt-2">
                  {c.holder_name ? `${c.holder_name} · ` : ""}Exp {String(c.exp_month).padStart(2, "0")}/{String(c.exp_year).slice(-2)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {c.is_default && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-bold">
                    <Star className="w-3 h-3" /> Default
                  </span>
                )}
                <button onClick={() => removeCard(c.pm_id)} className="p-2 bg-white/15 rounded-xl hover:bg-white/25 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {showForm ? (
          <div className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">New card</p>
            <input value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim())}
              placeholder="Card number" inputMode="numeric"
              className="w-full h-12 bg-muted/60 border border-border rounded-xl px-4 text-base font-semibold tracking-widest outline-none focus:border-primary" />
            <div className="flex gap-2">
              <input value={expiry}
                onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d); }}
                placeholder="MM/YY" inputMode="numeric"
                className="flex-1 h-12 bg-muted/60 border border-border rounded-xl px-4 font-semibold outline-none focus:border-primary" />
              <input value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="CVV" inputMode="numeric"
                className="w-24 h-12 bg-muted/60 border border-border rounded-xl px-4 font-semibold outline-none focus:border-primary" />
            </div>
            <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="Name on card (optional)"
              className="w-full h-12 bg-muted/60 border border-border rounded-xl px-4 font-semibold outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 h-11 bg-muted text-muted-foreground font-bold rounded-xl">Cancel</button>
              <button onClick={addCard} disabled={busy} className="flex-1 h-11 bg-primary text-white font-bold rounded-xl disabled:opacity-50">
                {busy ? "Saving…" : "Save card"}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Only the brand and last 4 digits are stored.
            </p>
          </div>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="w-full h-12 border-2 border-dashed border-primary/40 text-primary font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-slate-50 dark:bg-slate-900 transition-colors">
            <Plus className="w-4 h-4" /> Add a card
          </button>
        )}
      </div>
    </ConsumerLayout>
  );
}
