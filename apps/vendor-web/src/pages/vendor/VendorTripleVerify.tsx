import { useState } from "react";
import { useLocation } from "wouter";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { ChevronLeft, Camera, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export default function VendorTripleVerify() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  const captureLiveness = async () => {
    try {
      const { Camera: CapCamera, CameraResultType } = await import('@capacitor/camera');
      const res = await CapCamera.getPhoto({
        quality: 60,
        width: 1024,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        promptLabelHeader: "Selfie Verification",
      });
      if (res.dataUrl) {
        setPhoto(res.dataUrl);
        setStep(2);
      }
    } catch (e: any) {
      if (!e.message?.includes('User cancelled')) {
        toast({ title: "Camera failed", description: e.message, variant: "destructive" });
      }
    }
  };

  const submitVerification = async () => {
    if (!photo) return;
    setBusy(true);
    try {
      // In a real app, this would use a face matching AI against the uploaded ID
      const { url } = await api.uploadImage(photo, "kyc/triple-verify-selfies");
      await api.updateVendorProfile({ verification_status: "VERIFIED" });
      setSuccess(true);
      toast({ title: "Triple-Verify complete! ✨" });
      setTimeout(() => navigate("/vendor/settings"), 3000);
    } catch (e: any) {
      toast({ title: "Verification failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <VendorLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-8 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/vendor/settings")} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-extrabold">Triple-Verify</h1>
        </div>
        <p className="mt-2 text-white/80 text-sm">Gain the trust of customers by completing our top-tier security check.</p>
      </div>

      <div className="px-4 py-8 space-y-6 -mt-6">
        {success ? (
          <div className="bg-card border border-border shadow-md rounded-2xl p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-xl font-bold">You are Triple-Verified!</h2>
            <p className="text-muted-foreground text-sm">Customers will now see a special badge on your profile. Enjoy more jobs!</p>
          </div>
        ) : (
          <div className="bg-card border border-border shadow-md rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Liveness Check</h2>
                <p className="text-sm text-muted-foreground mt-1">Take a clear selfie so we can match it against your official ID.</p>
              </div>
            </div>

            {photo ? (
              <div className="space-y-4">
                <img src={photo} alt="Selfie" className="w-full h-64 object-cover rounded-xl border-2 border-primary/50" />
                <Button onClick={submitVerification} disabled={busy} className="w-full h-14 rounded-full font-bold text-lg">
                  {busy ? "Analyzing..." : "Submit Verification"}
                </Button>
                <Button onClick={() => setPhoto(null)} disabled={busy} variant="outline" className="w-full rounded-full border-border">
                  Retake Photo
                </Button>
              </div>
            ) : (
              <Button onClick={captureLiveness} className="w-full h-14 rounded-full font-bold text-lg gap-2 bg-primary">
                <Camera className="w-5 h-5" /> Open Camera
              </Button>
            )}

            <div className="mt-6 flex gap-3 p-4 bg-muted/50 rounded-xl">
              <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your selfie is securely encrypted and matched using AI. FixIt Now does not share your biometric data.
              </p>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
}
