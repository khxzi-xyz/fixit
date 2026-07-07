import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronLeft, Plus, CreditCard, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Button } from "@/components/ui/button";

export default function PaymentSettings() {
  const [, navigate] = useLocation();
  const [cards] = useState([
    { id: 1, type: "visa", last4: "4242", expiry: "12/26", isPrimary: true },
    { id: 2, type: "mastercard", last4: "5555", expiry: "08/25", isPrimary: false }
  ]);
  
  const [ledger] = useState([
    { id: 1, type: "deposit", amount: "+11.000", desc: "Top-up (+1 OMR Bonus)", date: "Today, 10:30 AM" },
    { id: 2, type: "charge", amount: "-4.500", desc: "AC Repair (Escrow Release)", date: "Yesterday, 2:15 PM" },
    { id: 3, type: "deposit", amount: "+23.000", desc: "Top-up (+3 OMR Bonus)", date: "Mon, 9:00 AM" }
  ]);

  return (
    <ConsumerLayout>
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-black">Payments & Wallet</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Top-up Scale Promo */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <h2 className="text-xl font-black mb-1">Top-up Bonuses</h2>
            <p className="text-sm text-white/80 mb-4">Earn compounding rewards when you add funds.</p>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white/10 p-2.5 rounded-full text-sm">
                <span>Deposit 10 OMR</span>
                <span className="font-bold text-green-300">+1 OMR Bonus</span>
              </div>
              <div className="flex justify-between items-center bg-white/10 p-2.5 rounded-full text-sm">
                <span>Deposit 20 OMR</span>
                <span className="font-bold text-green-300">+3 OMR Bonus</span>
              </div>
              <div className="flex justify-between items-center bg-white/10 p-2.5 rounded-full text-sm">
                <span>Deposit 30+ OMR</span>
                <span className="font-bold text-green-300">+5 OMR Bonus</span>
              </div>
            </div>
            <Button onClick={() => navigate("/wallet")} className="w-full mt-4 bg-white text-indigo-600 hover:bg-white/90 font-bold rounded-full h-12">
              Top Up Wallet Now
            </Button>
          </div>

          {/* Saved Cards */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-bold">Saved Cards</h3>
              <button className="text-primary text-sm font-bold flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <div className="space-y-3">
              {cards.map(c => (
                <div key={c.id} className="bg-card border border-border p-4 rounded-full flex items-center gap-4">
                  <div className="w-12 h-8 bg-muted rounded flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm uppercase tracking-wider">{c.type} •••• {c.last4}</p>
                    <p className="text-xs text-muted-foreground">Expires {c.expiry}</p>
                  </div>
                  {c.isPrimary && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ledger */}
          <div>
            <h3 className="font-bold mb-3 px-1">Recent Transactions</h3>
            <div className="bg-card border border-border rounded-full overflow-hidden shadow-sm">
              {ledger.map((item, i) => (
                <div key={item.id} className={`p-4 flex items-center gap-4 ${i !== ledger.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.type === 'deposit' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {item.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5 text-green-500" /> : <ArrowUpRight className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.desc}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.date}</p>
                  </div>
                  <div className={`font-black ${item.type === 'deposit' ? 'text-green-500' : 'text-foreground'}`}>
                    {item.amount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ConsumerLayout>
  );
}
