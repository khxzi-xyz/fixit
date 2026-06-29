import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, ArrowDownRight, ShieldAlert, History } from "lucide-react";

const MOCK_PAYOUTS = [
  { id: 1, amount: 150, date: "Oct 15, 2023", status: "completed", account: "**** 4452" },
  { id: 2, amount: 85, date: "Oct 01, 2023", status: "completed", account: "**** 4452" },
  { id: 3, amount: 200, date: "Sep 15, 2023", status: "completed", account: "**** 4452" },
];

export default function VendorWallet() {
  return (
    <VendorLayout>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Earnings & Wallet</h1>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-accent/20 to-card border-accent/30 shadow-lg relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Available for Payout</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-5xl font-bold text-foreground">850</h2>
                  <span className="text-xl text-muted-foreground font-medium">OMR</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <Wallet className="w-6 h-6 text-accent" />
              </div>
            </div>
            
            <Button className="w-full h-14 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              <ArrowDownRight className="w-5 h-5 mr-2" /> Request Payout
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">Next automatic payout window: Friday, 5:00 PM</p>
          </CardContent>
        </Card>

        {/* Escrow & Strikes */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">In Escrow</p>
              <h3 className="text-2xl font-bold text-foreground">45 <span className="text-sm text-muted-foreground">OMR</span></h3>
              <p className="text-[10px] text-muted-foreground mt-1">Awaiting warranty clearance</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border relative overflow-hidden">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Strike Count</p>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-success" />
                <h3 className="text-2xl font-bold text-success">0/3</h3>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Account in good standing</p>
            </CardContent>
          </Card>
        </div>

        {/* Payout History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5" /> Recent Payouts
            </h3>
          </div>
          <div className="space-y-3">
            {MOCK_PAYOUTS.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                <div>
                  <p className="font-bold text-foreground">{tx.amount} OMR</p>
                  <p className="text-xs text-muted-foreground">To Bank Muscat {tx.account}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-success/10 text-success border-success/20 shadow-none mb-1">PAID</Badge>
                  <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VendorLayout>
  );
}
