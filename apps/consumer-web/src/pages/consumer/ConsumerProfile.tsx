import { Link } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Bell, HelpCircle, LogOut, ChevronRight, Sparkles } from "lucide-react";

export default function ConsumerProfile() {
  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Profile</h1>

        <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl">
          <Avatar className="w-16 h-16 border-2 border-primary/20">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-xl">MA</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground">Mohammed Al-Rashidi</h2>
            <p className="text-sm text-muted-foreground">+968 9912 3456</p>
            <Badge variant="outline" className="mt-2 bg-muted text-muted-foreground border-border text-xs">FREE TIER</Badge>
          </div>
        </div>

        {/* Upgrade Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-primary">FixIt Plus</h3>
              </div>
              <p className="text-xs text-muted-foreground max-w-[200px]">Get zero service fees and priority matching.</p>
            </div>
            <Button size="sm" className="rounded-xl shadow-sm bg-primary text-primary-foreground font-semibold">
              Upgrade
            </Button>
          </CardContent>
        </Card>

        {/* Menu List */}
        <div className="space-y-1">
          {[
            { icon: Shield, label: "Security & Privacy" },
            { icon: Bell, label: "Notifications" },
            { icon: Settings, label: "App Settings" },
            { icon: HelpCircle, label: "Help & Support" },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 rounded-xl cursor-pointer transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border mt-4">
          <Link href="/auth/choice">
            <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive">
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </Link>
        </div>
      </div>
    </ConsumerLayout>
  );
}
