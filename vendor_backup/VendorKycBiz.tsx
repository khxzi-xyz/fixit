import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

export default function VendorKycBiz() {
  const [, setLocation] = useLocation();
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setBusy(true);
    try {
      // Mock KYC approval - instantly set to VENDOR for testing
      const { error } = await supabase.auth.updateUser({
        data: { role: "VENDOR" }
      });
      if (error) throw error;
      
      toast({ title: "KYC Approved", description: "You are now a verified Vendor!" });
      
      // We must refresh the session to get the new token claims so the backend accepts us
      const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
      if (refreshErr) throw refreshErr;
      
      if (refreshData.session) {
        const { setToken } = await import("@/lib/api");
        setToken(refreshData.session.access_token);
      }
      
      setLocation("/vendor/home");
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Business Documents" subtitle="Upload your trade license and permits." backTo="/auth/vendor/kyc-id">
      <div className="space-y-6">
        
        <div className="space-y-3">
          <label className="text-sm font-medium">Trade License (CR)</label>
          <div className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors bg-card">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-foreground">Tap to upload document</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, JPG up to 10MB</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Municipality Permit (Optional)</label>
          <div className="border border-border rounded-xl p-4 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <FileText className="w-5 h-5 text-success" />
              </div>
              <div className="text-left">
                <p className="font-medium text-sm">permit_2024.pdf</p>
                <p className="text-xs text-muted-foreground">1.2 MB</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleSubmit} disabled={busy} className="w-full h-14 rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">
            {busy ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
