import { VendorLayout } from "@/components/layouts/VendorLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, ShieldCheck, Bell, HelpCircle, LogOut, ChevronRight, CheckCircle2, Star } from "lucide-react";
import { Link } from "wouter";

export default function VendorProfile() {
  return (
    <VendorLayout>
      <div className="p-4 space-y-6 pb-24">
        
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Shop Profile</h1>
          <Link href="/vendor/upgrade">
            <Badge className="bg-gradient-to-r from-accent to-yellow-600 hover:from-accent hover:to-yellow-600 text-accent-foreground border-none font-bold shadow-[0_0_10px_rgba(250,204,21,0.5)] cursor-pointer">
              UPGRADE PRO
            </Badge>
          </Link>
        </div>

        <div className="p-5 bg-card border border-border rounded-2xl flex items-center gap-4">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-2xl shrink-0">
            AP
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-foreground">Ali's Plumbing</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Star className="w-4 h-4 text-accent fill-current" />
              <span className="font-medium text-foreground">4.9</span>
              <span>(890 reviews)</span>
            </div>
            <p className="text-xs text-muted-foreground">+968 9123 4567</p>
          </div>
        </div>

        {/* Approved Skills */}
        <div>
          <h3 className="font-bold text-lg mb-3">Verified Skills</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl">
              <span className="font-medium text-sm">Plumbing (General)</span>
              <div className="flex items-center gap-1 text-success text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> APPROVED
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl">
              <span className="font-medium text-sm">Water Heater Install</span>
              <div className="flex items-center gap-1 text-success text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> APPROVED
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl opacity-60">
              <span className="font-medium text-sm">AC Repair</span>
              <div className="flex items-center gap-1 text-warning text-xs font-bold">
                PENDING
              </div>
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg">Portfolio</h3>
            <Button variant="ghost" size="sm" className="text-primary text-xs h-8">Add Media</Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="aspect-square bg-muted rounded-xl border border-border flex items-center justify-center">IMG</div>
            <div className="aspect-square bg-muted rounded-xl border border-border flex items-center justify-center">IMG</div>
            <div className="aspect-square bg-muted rounded-xl border border-border flex items-center justify-center">IMG</div>
          </div>
        </div>

        {/* Menu List */}
        <div className="space-y-1">
          {[
            { icon: ShieldCheck, label: "KYC & Documents" },
            { icon: Bell, label: "Notifications" },
            { icon: Settings, label: "Shop Settings" },
            { icon: HelpCircle, label: "Vendor Support" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border mt-4">
          <Link href="/auth/choice">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive h-12">
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </Link>
        </div>
      </div>
    </VendorLayout>
  );
}
