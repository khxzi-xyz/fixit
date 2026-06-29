import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, History, ArrowUpRight, ArrowDownRight, ShieldCheck } from "lucide-react";

const MOCK_HISTORY = [
  { id: 1, type: "deposit", amount: 50, date: "Today, 10:30 AM", status: "completed" },
  { id: 2, type: "escrow", amount: 15, date: "Yesterday, 2:15 PM", status: "locked", job: "AC Repair" },
  { id: 3, type: "payment", amount: 25, date: "Oct 12, 4:00 PM", status: "completed", job: "Plumbing Fix" },
];

export default function ConsumerWallet() {
  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-primary/20 to-card border-primary/30 shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Available Balance</p>
            <div className="flex items-baseline gap-2 mb-6">
              <h2 className="text-5xl font-bold text-foreground">125</h2>
              <span className="text-xl text-muted-foreground font-medium">OMR</span>
            </div>
            
            <div className="flex gap-3">
              <Button className="flex-1 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                <ArrowUpRight className="w-4 h-4 mr-2" /> Top Up
              </Button>
              <Button variant="outline" className="flex-1 rounded-xl border-border hover:bg-muted">
                <ArrowDownRight className="w-4 h-4 mr-2" /> Withdraw
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Escrow Locks */}
        <div>
          <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" /> Active Escrow Locks
          </h3>
          <Card className="bg-card border-border">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">AC Repair Job</p>
                <p className="text-xs text-muted-foreground">Awaiting Vendor Completion</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-accent">15.00 OMR</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Locked</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Recent Transactions</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs">View All</Button>
          </div>
          <div className="space-y-3">
            {MOCK_HISTORY.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'deposit' ? 'bg-success/10 text-success' : 
                    tx.type === 'escrow' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                  }`}>
                    {tx.type === 'deposit' ? <ArrowDownRight className="w-5 h-5" /> : 
                     tx.type === 'escrow' ? <ShieldCheck className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium capitalize">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${tx.type === 'deposit' ? 'text-success' : ''}`}>
                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount} OMR
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ConsumerLayout>
  );
}
