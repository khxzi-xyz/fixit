import { useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function ConsumerRequestService() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [requestedCategoryName, setRequestedCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedCategoryName.trim()) return;
    
    setBusy(true);
    try {
      await api.createSupportTicket(
        "New Category Request", 
        `User requested a new service category: ${requestedCategoryName}\nDetails: ${description}`
      );
      toast({ title: "Request Submitted!", description: "Admins will review your request shortly." });
      setLocation("/home");
    } catch (err) {
      toast({ title: "Couldn't submit", description: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConsumerLayout>
      <div className="bg-primary text-primary-foreground border-b border-border text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-extrabold">Request a Service</h1>
        <p className="text-white/75 mt-1 text-sm">Can't find what you need? Tell us.</p>
      </div>
      <div className="p-4 max-w-2xl mx-auto mt-4">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-muted-foreground mb-6">
            If our current catalog doesn't cover your needs, request a new service below. We continuously add categories based on user demand.
          </p>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Service Name</Label>
              <Input 
                value={requestedCategoryName} 
                onChange={(e) => setRequestedCategoryName(e.target.value)} 
                placeholder="e.g., Aquarium Cleaning, Drone Repair" 
                className="bg-background h-12"
                required
              />
            </div>
            
            <div className="space-y-3">
              <Label>Details (Optional)</Label>
              <Input 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Tell us more about what this service entails..." 
                className="bg-background h-12"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-base font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]" 
              disabled={busy || !requestedCategoryName.trim()}
            >
              {busy ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </div>
      </div>
    </ConsumerLayout>
  );
}
