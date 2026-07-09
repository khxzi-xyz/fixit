import { useState, useEffect } from "react";
import { ChevronLeft, ShieldAlert, Smartphone, FileCheck, Trash2, LogOut, CheckCircle2, Fingerprint } from "lucide-react";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Button } from "@/components/ui/button";
import { isFingerprintAvailable, saveSecureToken, removeSecureToken } from "@/lib/biometrics";
import { tokenClaims, api } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function AccountSecurity() {
  const [showDelete, setShowDelete] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const queryClient = useQueryClient();

  const { data: devices = [] } = useQuery({
    queryKey: ["trusted-devices"],
    queryFn: () => api.trustedDevices(),
  });

  useEffect(() => {
    isFingerprintAvailable().then(setBioAvailable).catch(() => {});
    setBioEnabled(localStorage.getItem("fixit_bio_enabled") === "true");
  }, []);

  const toggleBio = async () => {
    if (bioEnabled) {
      await removeSecureToken();
      localStorage.removeItem("fixit_bio_enabled");
      setBioEnabled(false);
    } else {
      const claims = tokenClaims();
      if (claims?.sub) {
        // We'd normally save the actual JWT, but we just want to save the user ID and enable it.
        await saveSecureToken(claims.sub, "enabled");
        localStorage.setItem("fixit_bio_enabled", "true");
        setBioEnabled(true);
      }
    }
  };

  const removeDevice = async (deviceId: string) => {
    try {
      await api.deleteTrustedDevice(deviceId);
      queryClient.invalidateQueries({ queryKey: ["trusted-devices"] });
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <ConsumerLayout>
      <div className="bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => window.history.back()} className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-black">Account Security</h1>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Biometric Auth */}
          {bioAvailable && (
            <div>
              <h3 className="font-bold mb-3 px-1">Biometric Login</h3>
              <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                  <Fingerprint className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm">FaceID / TouchID</h4>
                  <p className="text-xs text-muted-foreground mt-1">Sign in quickly without a password.</p>
                </div>
                <button
                  onClick={toggleBio}
                  className={`w-12 h-6 rounded-xl transition-all relative ${bioEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-xl shadow transition-all ${bioEnabled ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            </div>
          )}

          {/* Identity Verification */}
          <div>
            <h3 className="font-bold mb-3 px-1">Identity Verification</h3>
            <div className="bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <FileCheck className="w-6 h-6 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold">Advanced Verification</h4>
                  <p className="text-xs text-muted-foreground mt-1">Upload your Civil ID or Passport to unlock the Verified Customer Badge.</p>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 h-12 rounded-xl text-primary font-bold">
                Start Verification
              </Button>
            </div>
          </div>

          {/* Bound Devices */}
          <div>
            <h3 className="font-bold mb-3 px-1">Trusted Devices</h3>
            <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
              {devices && devices.length > 0 ? (
                devices.map((device: any, index: number) => (
                  <div key={device.device_id} className={`p-4 flex items-center gap-4 ${index !== devices.length - 1 ? 'border-b border-border' : ''}`}>
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm truncate">{device.device_name || "Unknown Device"}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {device.ip_address ? `IP: ${device.ip_address} • ` : ''}
                        Last active: {new Date(device.last_active).toLocaleDateString()}
                      </p>
                    </div>
                    <button onClick={() => removeDevice(device.device_id)} className="text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-colors">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No trusted devices found.
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4">
            <h3 className="font-bold text-red-500 mb-3 px-1">Danger Zone</h3>
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-red-500">Delete Account</h4>
                  <p className="text-xs text-red-500/80 mt-1">Permanently remove your personal data. Ledger history is archived securely.</p>
                </div>
              </div>
              <Button onClick={() => setShowDelete(true)} variant="destructive" className="w-full mt-4 h-12 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white">
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showDelete && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-border relative overflow-hidden">
            <div className="w-16 h-16 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-center mb-2">Are you absolutely sure?</h2>
            <p className="text-sm text-center text-muted-foreground mb-6">
              This action cannot be undone. All active warranties and escrows will be forfeited.
            </p>
            <div className="space-y-3">
              <Button variant="destructive" className="w-full h-12 rounded-xl font-bold text-base" onClick={() => alert("Action triggered. Contact support to confirm.")}>
                Yes, Delete Account
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl font-bold text-base" onClick={() => setShowDelete(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConsumerLayout>
  );
}
