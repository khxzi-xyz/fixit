import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, ShieldCheck, CheckCircle2, Clock, Camera } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function OrderTracking() {
  const [, params] = useRoute("/order/:id");
  const jobId = params?.id || "101";

  return (
    <ConsumerLayout>
      <div className="relative min-h-screen bg-background">
        {/* Mock Map Background */}
        <div className="absolute inset-0 h-[40vh] bg-muted overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, #1B6EF3 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          {/* Path Line */}
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-t-2 border-l-2 border-primary border-dashed rounded-tl-[100px] opacity-50"></div>
          {/* Vendor Dot */}
          <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-primary rounded-full animate-pulse shadow-[0_0_15px_rgba(27,110,243,0.8)]"></div>
          {/* Destination Dot */}
          <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-background rounded-full"></div>
          </div>
        </div>

        {/* Content Sheet */}
        <div className="absolute top-[35vh] inset-x-0 bottom-0 bg-background rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] p-6 overflow-y-auto z-10 pb-24">
          <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6"></div>
          
          <div className="flex justify-between items-start mb-6">
            <div>
              <Badge className="bg-primary text-primary-foreground mb-2 shadow-[0_0_10px_rgba(27,110,243,0.3)]">ON MY WAY</Badge>
              <h1 className="text-2xl font-bold tracking-tight">Mohammed is arriving</h1>
              <p className="text-muted-foreground text-sm mt-1">ETA: 8 mins away</p>
            </div>
            <div className="w-14 h-14 bg-card border border-border rounded-full flex items-center justify-center overflow-hidden">
              <div className="text-lg font-bold text-primary">MA</div>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <Button className="flex-1 h-12 rounded-xl bg-card border border-border text-foreground hover:bg-muted" variant="outline">
              <Phone className="w-5 h-5 mr-2 text-primary" /> Contact
            </Button>
            <Link href={`/order/${jobId}/warranty`} className="flex-1">
              <Button className="w-full h-12 rounded-xl bg-card border border-border text-foreground hover:bg-muted" variant="outline">
                <ShieldCheck className="w-5 h-5 mr-2 text-success" /> Warranty
              </Button>
            </Link>
          </div>

          <div className="space-y-6">
            <h3 className="font-bold text-lg">Parts Protocol</h3>
            
            <Card className="bg-card border-border hover:border-primary/50 transition-colors cursor-pointer rounded-xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Multi-Receipt Log</h4>
                    <p className="text-xs text-muted-foreground">Vendor uploads receipts for approval</p>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border opacity-50 rounded-xl">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Escort Mode</h4>
                    <p className="text-xs text-muted-foreground">Go with vendor to buy parts</p>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full border-2 border-border"></div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="font-bold text-lg">Verification Photos</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square bg-muted rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs font-medium">Before (Vendor)</span>
              </div>
              <div className="aspect-square bg-muted rounded-xl border border-dashed border-border flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-xs font-medium">After (Vendor)</span>
              </div>
            </div>
            <Link href={`/order/${jobId}/review`} className="block mt-4">
              <Button className="w-full h-14 rounded-xl text-lg font-bold bg-success hover:bg-success/90 text-success-foreground">
                Approve Completion
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </ConsumerLayout>
  );
}
