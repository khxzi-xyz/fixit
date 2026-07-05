import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { ScanFace, Camera } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { watermarkImage } from "@/lib/watermark";
import { useToast } from "@/hooks/use-toast";

export default function VendorKycId() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleUpload = async () => {
    setBusy(true);
    try {
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        saveToGallery: true
      });

      if (image.webPath) {
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        const file = new File([blob], `kyc_${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        const dataUrl = await watermarkImage(file);
        await api.kycUpload('ID_CARD', dataUrl);
        toast({ title: "ID uploaded successfully" });
        setLocation("/auth/vendor/kyc-biz");
      }
    } catch (err: any) {
      console.warn(err);
      toast({ title: "Failed to upload or cancelled", description: err.message });
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthLayout title="Identity Verification" subtitle="We need to verify your identity to ensure platform safety." backTo="/auth/vendor/register">
      <div className="space-y-6">
        <div className="aspect-[3/4] bg-muted border-2 border-primary/50 border-dashed rounded-2xl relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* Mock Camera Frame */}
          <div className="w-48 h-64 border-4 border-white/50 rounded-xl relative z-10 flex items-center justify-center">
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
          <Button variant="outline" className="flex-1 h-14 rounded-xl border-border bg-card" onClick={handleUpload} disabled={busy}>
            <Camera className="w-5 h-5 mr-2" /> {busy ? "Uploading..." : "Take Photo"}
          </Button>
          <Link href="/auth/vendor/kyc-biz" className="flex-1 block">
            <Button className="w-full h-14 rounded-xl bg-primary text-primary-foreground font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">
              Next Step
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
