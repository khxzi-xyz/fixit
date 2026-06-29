import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Sparkles, ImagePlus, Video, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function ConsumerPostJob() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isBounty, setIsBounty] = useState(false);
  const [description, setDescription] = useState("");

  const handleAiRewrite = () => {
    setDescription("Urgent: Kitchen sink pipe burst under the counter. Need immediate repair to stop the leak. Parts likely required. Easy access on ground floor.");
    toast({
      title: "Enhanced with AI",
      description: "Your description has been optimized for better vendor matches.",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submit
    setLocation("/home");
    toast({ title: "Job Posted!", description: "Vendors have been notified." });
  };

  return (
    <ConsumerLayout>
      <div className="p-4 space-y-6 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Post a Job</h1>
          <p className="text-muted-foreground mt-1 text-sm">Describe what you need, get bids in minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Service Category</Label>
            <select className="w-full h-12 px-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary outline-none">
              <option value="">Select a category...</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="ac">AC Repair</option>
              <option value="auto">Auto Repair</option>
            </select>
          </div>

          <div className="space-y-3 relative">
            <div className="flex justify-between items-center">
              <Label>Description</Label>
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-primary gap-1" onClick={handleAiRewrite}>
                <Sparkles className="w-3 h-3" /> AI Rewrite
              </Button>
            </div>
            <Textarea 
              placeholder="E.g., My kitchen sink pipe burst and water is leaking everywhere..."
              className="min-h-[120px] bg-card rounded-xl border-border resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Media (Photos/Video)</Label>
            <div className="grid grid-cols-4 gap-2">
              <div className="aspect-square bg-muted border border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-card transition-colors">
                <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Add Photo</span>
              </div>
              <div className="aspect-square bg-muted border border-dashed border-border rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-card transition-colors">
                <Video className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Add Video</span>
              </div>
              {/* Empty slots for visual */}
              <div className="aspect-square bg-card border border-border rounded-xl opacity-50 flex items-center justify-center"></div>
              <div className="aspect-square bg-card border border-border rounded-xl opacity-50 flex items-center justify-center"></div>
            </div>
            <p className="text-xs text-muted-foreground">Free tier includes 3 photos + 1 short video.</p>
          </div>

          <div className="p-4 border border-border rounded-xl bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold text-foreground">Bounty Bargain</Label>
                <p className="text-xs text-muted-foreground mt-1">Set a fixed price instead of an auction.</p>
              </div>
              <Switch checked={isBounty} onCheckedChange={setIsBounty} />
            </div>
            
            {isBounty && (
              <div className="pt-4 border-t border-border animate-in slide-in-from-top-2">
                <Label>Your Price (OMR)</Label>
                <div className="relative mt-2">
                  <Input type="number" placeholder="0.00" className="pl-12 bg-background border-border h-12 text-lg" required />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">OMR</span>
                </div>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl shadow-[0_0_20px_rgba(27,110,243,0.3)]">
            Post Job
          </Button>
        </form>
      </div>
    </ConsumerLayout>
  );
}
