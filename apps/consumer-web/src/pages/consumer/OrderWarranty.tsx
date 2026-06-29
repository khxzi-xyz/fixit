import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Clock, Check } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function OrderWarranty() {
  const [, params] = useRoute("/order/:id/warranty");
  const jobId = params?.id || "101";

  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6 max-w-xl mx-auto">
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Warranty Agreement</h1>
          <p className="text-muted-foreground text-sm mt-2">Your funds will remain in escrow until this period ends without disputes.</p>
        </div>

        <Card className="bg-card border-border shadow-lg">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6 border-b border-border pb-6">
              <div>
                <p className="text-sm text-muted-foreground">Vendor Proposed</p>
                <h2 className="text-2xl font-bold mt-1 text-foreground">7 Days</h2>
              </div>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-4">
              <Button className="w-full h-14 rounded-xl text-lg font-bold bg-success hover:bg-success/90 text-success-foreground">
                <Check className="w-5 h-5 mr-2" /> Agree to 7 Days
              </Button>
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase font-medium">Or Counter Offer</span>
                <div className="flex-grow border-t border-border"></div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="h-12 rounded-xl border-border">14 Days</Button>
                <Button variant="outline" className="h-12 rounded-xl border-border">30 Days</Button>
                <Button variant="outline" className="h-12 rounded-xl border-border">Custom</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <Link href={`/order/${jobId}`} className="text-primary font-medium text-sm">
            Back to Order Tracking
          </Link>
        </div>
      </div>
    </ConsumerLayout>
  );
}
