import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { ScanFace, Camera } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { watermarkImage } from "@/lib/watermark";
import { useToast } from "@/hooks/use-toast";
import { Capacitor } from "@capacitor/core";

export default function VendorKycId() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleCapture = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Camera, CameraSource, CameraResultType } = await import("@capacitor/camera");
        const perm = await Camera.requestPermissions();
        if (perm.camera !== "granted") {
          toast({ title: "Camera permission denied", variant: "destructive" });
          return;
        }
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera, // Live camera only for KYC (Triple-Verify)
        });
        if (image.dataUrl) {
          await processUpload(image.dataUrl);
        }
      } catch (err: any) {
        if (err?.message !== "User cancelled photos app") {
          toast({ title: "Camera error", description: err.message, variant: "destructive" });
        }
      }
    } else {
      fileRef.current?.click();
    }
  };

  const handleWebUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await watermarkImage(file);
      await processUpload(dataUrl);
    } catch (err: any) {
      toast({ title: "Failed to upload", description: err.message, variant: "destructive" });
      setBusy(false);
    }
  };

  const processUpload = async (dataUrl: string) => {
    setBusy(true);
    try {
      await api.kycUpload('ID_CARD', dataUrl);
      toast({ title: "ID uploaded successfully" });
      setLocation("/auth/vendor/kyc-biz");
    } catch (err: any) {
      toast({ title: "Failed to upload", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Identity Verification" subtitle="We need to verify your identity to ensure platform safety." backTo="/auth/vendor/register">
      <div className="space-y-6">
        <div className="aspect-[3/4] bg-muted border-2 border-primary/50 border-dashed rounded-full relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* Mock Camera Frame */}
          <div className="w-48 h-64 border-4 border-white/50 rounded-full relative z-10 flex items-center justify-center">
            <ScanFace className="w-16 h-16 text-white/50" />
            
            {/* Corner marks */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-primary"></div>
          </div>
          
          <p className="text-white z-10 mt-6 font-medium px-8 text-center text-sm">Position your Resident Card within the frame</p>
        </div>

        <div className="flex gap-3">
          <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={handleWebUpload} />
          <Button variant="outline" className="flex-1 h-14 rounded-full border-border bg-card" onClick={handleCapture} disabled={busy}>
            <Camera className="w-5 h-5 mr-2" /> {busy ? "Uploading..." : "Take Photo"}
          </Button>
          <Link href="/auth/vendor/kyc-biz" className="flex-1 block">
            <Button className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">
              Next Step
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
