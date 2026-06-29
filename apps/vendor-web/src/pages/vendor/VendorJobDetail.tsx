import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Image as ImageIcon, Zap, ChevronLeft } from "lucide-react";
import { Link, useRoute } from "wouter";

export default function VendorJobDetail() {
  const [, params] = useRoute("/vendor/jobs/:id");
  const jobId = params?.id || "105";

  return (
    <VendorLayout>
      <div className="p-4 space-y-6 pb-32">
        <Link href="/vendor/jobs" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Feed
        </Link>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-destructive/10 text-destructive text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">High Urgency</span>
            <span className="text-muted-foreground text-xs">Job #{jobId}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-4">Install Water Heater</h1>
          
          <p className="text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl border border-border">
            "I bought a new 50L water heater from Danube. Need someone to remove the old leaking one and install the new one today. Easy access in the external bathroom."
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm font-medium bg-card border border-border p-3 rounded-xl">
          <MapPin className="w-5 h-5 text-primary" />
          <span>Bousher Area, ~2.4 km away</span>
        </div>

        <div>
          <h3 className="font-bold mb-3">Consumer Media</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <div className="w-24 h-24 bg-muted rounded-xl border border-border flex items-center justify-center shrink-0">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="w-24 h-24 bg-muted rounded-xl border border-border flex items-center justify-center shrink-0">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Submit Your Bid</h2>
          
          <form className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Khidmah (Labor OMR)</Label>
                <Input type="number" placeholder="15" className="h-14 text-lg bg-card border-border rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label>ETA (Minutes)</Label>
                <Input type="number" placeholder="30" className="h-14 text-lg bg-card border-border rounded-xl" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Warranty Offer (Days)</Label>
              <select className="w-full h-14 px-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary outline-none">
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="90">3 Months</option>
              </select>
            </div>
          </form>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border z-40">
          <Button className="w-full h-14 rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">
            <Zap className="w-5 h-5 mr-2" /> Place Bid (1 Token)
          </Button>
        </div>
      </div>
    </VendorLayout>
  );
}
