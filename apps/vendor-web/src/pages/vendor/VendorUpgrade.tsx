import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2, Star, ImagePlus } from "lucide-react";
import { Link } from "wouter";

export default function VendorUpgrade() {
  return (
    <VendorLayout>
      <div className="p-4 space-y-6 pb-24">
        
        <div className="text-center pt-8 pb-4">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-accent/50">
            <Star className="w-10 h-10 text-accent fill-current" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">FixIt <span className="text-accent">Pro</span></h1>
          <p className="text-muted-foreground mt-2">Dominate your local market. Stand out, bid more, earn more.</p>
        </div>

        <Card className="bg-gradient-to-br from-accent/10 to-card border-accent/40 shadow-[0_0_30px_rgba(250,204,21,0.15)] relative overflow-hidden">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-4xl font-bold text-foreground">19.99 <span className="text-xl text-muted-foreground font-medium">OMR</span></h2>
              <p className="text-sm text-muted-foreground">per month, tax included</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Blue Tick Verification</h4>
                  <p className="text-xs text-muted-foreground">Gain ultimate consumer trust with a verified badge next to your name.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Unlimited Bids</h4>
                  <p className="text-xs text-muted-foreground">No more bid tokens. Bid on as many jobs as you can handle.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Featured Bid Pin</h4>
                  <p className="text-xs text-muted-foreground">Your bid gets pinned to the top of the consumer's list automatically.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Rich Shop Profile</h4>
                  <p className="text-xs text-muted-foreground">Upload unlimited portfolio photos and add detailed business descriptions.</p>
                </div>
              </div>
            </div>

            <Button className="w-full h-14 rounded-xl text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              Upgrade to Pro
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link href="/vendor/profile" className="text-sm text-muted-foreground hover:text-foreground font-medium">
            Maybe later
          </Link>
        </div>
      </div>
    </VendorLayout>
  );
}
