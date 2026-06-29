import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function JobPayment() {
  const [, params] = useRoute("/job/:id/payment");
  const jobId = params?.id || "101";

  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6 max-w-xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lock Escrow</h1>
          <p className="text-muted-foreground text-sm mt-1">Funds are held securely until the job is completed and warranty clears.</p>
        </div>

        <Card className="bg-card border-primary/30 border shadow-[0_0_30px_rgba(27,110,243,0.1)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Khidmah Lock</p>
                  <p className="text-sm text-muted-foreground">Labor cost only</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-3xl font-bold text-foreground">15.00</h2>
                <span className="text-sm text-muted-foreground font-medium">OMR</span>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-xl mb-6">
              <div className="flex gap-2 items-start text-sm">
                <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <p className="text-muted-foreground"><strong className="text-foreground">Reminder:</strong> Parts are not included in this amount. You will approve and pay for parts separately via the app once the vendor evaluates the issue.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold">Top-Up Wallet</h3>
              <p className="text-sm text-muted-foreground">Transfer to our Bank Muscat account and upload the receipt.</p>
              
              <div className="grid grid-cols-5 gap-2 text-center text-xs font-medium">
                <div className="p-2 rounded-lg bg-card border border-border">10 → 11</div>
                <div className="p-2 rounded-lg bg-card border border-border">20 → 23</div>
                <div className="p-2 rounded-lg bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(27,110,243,0.4)]">30 → 35</div>
                <div className="p-2 rounded-lg bg-card border border-border">40 → 45</div>
                <div className="p-2 rounded-lg bg-card border border-border">50 → 55</div>
              </div>

              <div className="space-y-3 pt-2">
                <Label>Bank Transfer Screenshot</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Tap to upload receipt</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG up to 5MB</p>
                </div>
              </div>
            </div>

            <Link href={`/order/${jobId}`} className="block mt-6">
              <Button className="w-full h-14 rounded-xl text-lg font-bold">
                Confirm & Lock Funds <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </ConsumerLayout>
  );
}
