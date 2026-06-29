import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Link } from "wouter";

export default function ConsumerUpgrade() {
  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6 pb-24">
        
        <div className="text-center pt-8 pb-4">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-primary/30">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FixIt <span className="text-primary">Plus</span></h1>
          <p className="text-muted-foreground mt-2">Elevate your experience. Zero fees, priority matching, peace of mind.</p>
        </div>

        <Card className="bg-gradient-to-br from-primary/10 to-card border-primary/30 shadow-[0_0_30px_rgba(27,110,243,0.15)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-primary text-primary-foreground text-xs font-bold rounded-bl-xl shadow-lg">MOST POPULAR</div>
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-4xl font-bold text-foreground">4.99 <span className="text-xl text-muted-foreground font-medium">OMR</span></h2>
              <p className="text-sm text-muted-foreground">per month, cancel anytime</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Zero Service Fees</h4>
                  <p className="text-xs text-muted-foreground">Save 20% on every job. You pay exactly what the vendor bids.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Priority Matching</h4>
                  <p className="text-xs text-muted-foreground">Your jobs get pushed to the top of vendor feeds instantly.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Extended Escrow Warranty</h4>
                  <p className="text-xs text-muted-foreground">Get an automatic +7 days on all vendor warranties.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Unlimited AI Rewrites</h4>
                  <p className="text-xs text-muted-foreground">Perfect your job descriptions to get the best bids faster.</p>
                </div>
              </div>
            </div>

            <Button className="w-full h-14 rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">
              Upgrade to Plus
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/profile" className="text-sm text-muted-foreground hover:text-foreground font-medium">
            No thanks, keep me on the Free tier
          </Link>
        </div>
      </div>
    </ConsumerLayout>
  );
}
