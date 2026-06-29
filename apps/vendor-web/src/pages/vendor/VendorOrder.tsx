import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navigation, Phone, MapPin, Receipt, Camera, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function VendorOrder() {
  const [status, setStatus] = useState<"assigned"|"dispatched"|"arrived"|"working">("assigned");

  return (
    <VendorLayout>
      <div className="p-4 space-y-6 pb-24">
        
        <div className="flex justify-between items-start">
          <div>
            <Badge className="bg-primary text-primary-foreground mb-2">{status.toUpperCase()}</Badge>
            <h1 className="text-2xl font-bold tracking-tight">Leaking Kitchen Pipe</h1>
            <p className="text-muted-foreground text-sm mt-1">Client: Ahmed (Al Seeb)</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-accent">15.00</p>
            <p className="text-[10px] text-muted-foreground uppercase font-medium">OMR Locked</p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          {status === "assigned" && (
            <Button onClick={() => setStatus("dispatched")} className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
              <Navigation className="w-5 h-5 mr-2" /> Tap when "On My Way"
            </Button>
          )}
          
          {status === "dispatched" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-12 rounded-xl border-border">
                  <Phone className="w-4 h-4 mr-2" /> Call
                </Button>
                <Button variant="outline" className="flex-1 h-12 rounded-xl border-border">
                  <MapPin className="w-4 h-4 mr-2" /> Map
                </Button>
              </div>
              <Button onClick={() => setStatus("arrived")} className="w-full h-14 rounded-xl text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
                I Have Arrived
              </Button>
            </div>
          )}

          {status === "arrived" && (
            <Button onClick={() => setStatus("working")} className="w-full h-14 rounded-xl text-lg font-bold bg-warning hover:bg-warning/90 text-warning-foreground">
              Start Work
            </Button>
          )}

          {status === "working" && (
            <div className="flex items-center gap-3 text-success p-2 bg-success/10 rounded-xl justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" /> Job in Progress
            </div>
          )}
        </div>

        {/* Parts Protocol Section */}
        <div className={`space-y-4 ${status !== 'working' ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-lg font-bold border-t border-border pt-6">Parts Protocol</h2>
          
          <Card className="bg-card border-border">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Log New Receipt</h4>
                  <p className="text-xs text-muted-foreground">Upload store receipt for client approval</p>
                </div>
              </div>
              <Button variant="outline" className="w-full rounded-xl border-dashed border-2 border-border h-12">
                + Add Part / Material
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Completion Section */}
        <div className={`space-y-4 ${status !== 'working' ? 'opacity-50 pointer-events-none' : ''}`}>
          <h2 className="text-lg font-bold border-t border-border pt-6">Completion</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-square bg-muted rounded-xl border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-card">
              <Camera className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-xs font-medium">Before Photo</span>
            </div>
            <div className="aspect-square bg-muted rounded-xl border border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-card">
              <Camera className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-xs font-medium">After Photo</span>
            </div>
          </div>
          
          <Button className="w-full h-14 rounded-xl text-lg font-bold bg-success hover:bg-success/90 text-success-foreground shadow-[0_0_20px_rgba(22,163,74,0.3)]">
            Request Client Approval
          </Button>
        </div>

      </div>
    </VendorLayout>
  );
}
