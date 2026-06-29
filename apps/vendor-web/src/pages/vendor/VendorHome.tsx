import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Zap, Clock, Star, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function VendorHome() {
  const [isAvailable, setIsAvailable] = useState(true);

  return (
    <VendorLayout>
      <div className="p-4 space-y-6">
        
        {/* Header & Status Toggle */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Ali's Plumbing LLC</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <Label className={`font-bold ${isAvailable ? 'text-success' : 'text-muted-foreground'}`}>
                {isAvailable ? 'AVAILABLE NOW' : 'OFFLINE'}
              </Label>
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} className="data-[state=checked]:bg-success" />
            </div>
            {isAvailable && (
              <span className="text-[10px] text-success animate-pulse flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-success rounded-full"></div> Bat-Signal Active
              </span>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Tokens</p>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                <h2 className="text-2xl font-bold">142</h2>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider">Earnings</p>
              <div className="flex items-baseline gap-1">
                <h2 className="text-2xl font-bold text-accent">850</h2>
                <span className="text-xs font-medium text-muted-foreground">OMR</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Job Alert */}
        <div>
          <h2 className="text-lg font-bold mb-3">Current Assignment</h2>
          <Link href="/vendor/order/101">
            <Card className="bg-gradient-to-r from-primary/20 to-card border-primary/30 relative overflow-hidden cursor-pointer hover:border-primary/60 transition-colors rounded-xl shadow-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <Badge className="bg-primary text-primary-foreground shadow-[0_0_10px_rgba(27,110,243,0.3)]">DISPATCHED</Badge>
                  <span className="text-sm font-medium text-muted-foreground">15 OMR</span>
                </div>
                <h3 className="font-bold text-lg mb-1 text-foreground">Leaking Kitchen Pipe</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>Al Seeb, Muscat (8 mins away)</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/vendor/jobs" className="p-4 bg-card border border-border rounded-xl flex items-center gap-3 hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Find Jobs</span>
            </Link>
            <Link href="/vendor/profile" className="p-4 bg-card border border-border rounded-xl flex items-center gap-3 hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <Star className="w-5 h-5" />
              </div>
              <span className="font-semibold text-sm">Reviews</span>
            </Link>
          </div>
        </div>

      </div>
    </VendorLayout>
  );
}
