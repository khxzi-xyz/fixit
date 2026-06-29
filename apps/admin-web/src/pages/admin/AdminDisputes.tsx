import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, User, HardHat, Camera, RefreshCw } from "lucide-react";

const MOCK_DISPUTES = [
  { id: "DSP-089", job: "AC Repair", amount: 25, consumer: "Ahmed", vendor: "Cool Tech LLC", reason: "AC stopped cooling again after 2 days. Vendor refusing to return under warranty." },
];

export default function AdminDisputes() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-destructive" /> Dispute Resolution
          </h1>
          <p className="text-muted-foreground mt-1">Review evidence and mediate escrow releases.</p>
        </div>

        {MOCK_DISPUTES.map((dispute) => (
          <Card key={dispute.id} className="bg-card border-destructive/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <CardContent className="p-6">
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-destructive uppercase tracking-wider">{dispute.id}</span>
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">ESCALATED</Badge>
                  </div>
                  <h3 className="text-xl font-bold">{dispute.job}</h3>
                  <p className="text-sm text-muted-foreground font-medium mt-1">Escrow Amount: <span className="text-foreground">{dispute.amount} OMR</span></p>
                </div>
              </div>

              {/* Parties & Claim */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3 border border-border">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase">Consumer Claim</p>
                      <p className="font-semibold">{dispute.consumer}</p>
                    </div>
                  </div>
                  <p className="text-sm p-3 bg-destructive/5 text-destructive border border-destructive/10 rounded-lg leading-relaxed">
                    "{dispute.reason}"
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3 border border-border">
                    <div className="w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                      <HardHat className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-bold uppercase">Vendor Stance</p>
                      <p className="font-semibold">{dispute.vendor}</p>
                    </div>
                  </div>
                  <p className="text-sm p-3 bg-card border border-border rounded-lg leading-relaxed text-muted-foreground">
                    "Issue is unrelated to the gas top-up performed. Compressor is failing, requires new part. Not covered under labor warranty."
                  </p>
                </div>
              </div>

              {/* Evidence */}
              <div className="mb-6">
                <h4 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Verification Photos (Vendor)</h4>
                <div className="flex gap-4">
                  <div className="w-40 h-40 bg-muted rounded-xl border border-border flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">Before</span>
                  </div>
                  <div className="w-40 h-40 bg-muted rounded-xl border border-border flex flex-col items-center justify-center text-muted-foreground">
                    <Camera className="w-6 h-6 mb-2" />
                    <span className="text-xs font-medium">After</span>
                  </div>
                </div>
              </div>

              {/* Decision Actions */}
              <div className="flex gap-3 pt-6 border-t border-border">
                <Button className="flex-1 h-12 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold">
                  Refund Consumer ({dispute.amount} OMR)
                </Button>
                <Button className="flex-1 h-12 bg-success hover:bg-success/90 text-success-foreground font-bold">
                  Release to Vendor ({dispute.amount} OMR)
                </Button>
                <Button variant="outline" className="h-12 px-6 border-border">
                  <RefreshCw className="w-4 h-4 mr-2" /> Request More Info
                </Button>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
