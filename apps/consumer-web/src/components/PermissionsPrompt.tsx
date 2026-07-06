import { useEffect, useState } from "react";
import { Camera } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from "@capacitor/push-notifications";
import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";
import { ShieldCheck, MapPin, Camera as CameraIcon, Bell, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { Button } from "./ui/button";

export function PermissionsPrompt({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(false);
  
  const [perms, setPerms] = useState({
    location: "idle",
    camera: "idle",
    push: "idle"
  });

  useEffect(() => {
    async function check() {
      if (!Capacitor.isNativePlatform()) {
        onComplete();
        return;
      }
      const { value } = await Preferences.get({ key: "permissions_requested" });
      if (value === "true") {
        onComplete();
      } else {
        setShow(true);
      }
    }
    check();
  }, [onComplete]);

  const requestCamera = async () => {
    try {
      setPerms(p => ({ ...p, camera: "loading" }));
      const status = await Camera.requestPermissions();
      setPerms(p => ({ ...p, camera: status.camera === "granted" ? "granted" : "denied" }));
    } catch (e) {
      console.error(e);
      setPerms(p => ({ ...p, camera: "denied" }));
    }
  };

  const requestLocation = async () => {
    try {
      setPerms(p => ({ ...p, location: "loading" }));
      const status = await Geolocation.requestPermissions();
      setPerms(p => ({ ...p, location: status.location === "granted" || status.coarseLocation === "granted" ? "granted" : "denied" }));
    } catch (e) {
      console.error(e);
      setPerms(p => ({ ...p, location: "denied" }));
    }
  };

  const requestPush = async () => {
    try {
      setPerms(p => ({ ...p, push: "loading" }));
      const status = await PushNotifications.requestPermissions();
      setPerms(p => ({ ...p, push: status.receive === "granted" ? "granted" : "denied" }));
    } catch (e) {
      console.error(e);
      setPerms(p => ({ ...p, push: "denied" }));
    }
  };

  const finish = async () => {
    await Preferences.set({ key: "permissions_requested", value: "true" });
    setShow(false);
    onComplete();
  };

  if (!show) return null;

  const allRequested = perms.location !== "idle" && perms.camera !== "idle" && perms.push !== "idle";

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <ShieldCheck className="w-10 h-10 text-primary" />
      </div>
      
      <h1 className="text-2xl font-black mb-3">Welcome to FixIt</h1>
      <p className="text-muted-foreground mb-8 text-sm leading-relaxed px-4">
        To provide you with the best experience, FixIt needs access to a few features on your device.
      </p>

      <div className="w-full space-y-4 mb-10">
        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl text-left border border-border">
          <MapPin className="w-6 h-6 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Location</p>
            <p className="text-xs text-muted-foreground">To find service pros near you instantly.</p>
          </div>
          {perms.location === "granted" ? (
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          ) : (
            <Button onClick={requestLocation} disabled={perms.location !== "idle"} variant="outline" size="sm" className="shrink-0 rounded-xl">
              {perms.location === "idle" ? "Allow" : "Denied"}
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl text-left border border-border">
          <CameraIcon className="w-6 h-6 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Camera</p>
            <p className="text-xs text-muted-foreground">To upload photos of your repair issues.</p>
          </div>
          {perms.camera === "granted" ? (
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          ) : (
            <Button onClick={requestCamera} disabled={perms.camera !== "idle"} variant="outline" size="sm" className="shrink-0 rounded-xl">
              {perms.camera === "idle" ? "Allow" : "Denied"}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl text-left border border-border">
          <Bell className="w-6 h-6 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Notifications</p>
            <p className="text-xs text-muted-foreground">To alert you when a pro arrives or messages you.</p>
          </div>
          {perms.push === "granted" ? (
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
          ) : (
            <Button onClick={requestPush} disabled={perms.push !== "idle"} variant="outline" size="sm" className="shrink-0 rounded-xl">
              {perms.push === "idle" ? "Allow" : "Denied"}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl text-left border border-border">
          <Phone className="w-6 h-6 text-primary shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Calls & Phone</p>
            <p className="text-xs text-muted-foreground">To securely detect offline vendor fraud and enable quick dial.</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0 rounded-xl pointer-events-none">
            Will Ask
          </Button>
        </div>
      </div>

      <Button onClick={finish} disabled={!allRequested} className="w-full h-14 rounded-xl text-base font-bold gap-2">
        Continue to App <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
