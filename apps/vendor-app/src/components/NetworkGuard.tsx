/**
 * NetworkGuard.tsx
 *
 * Renders a sticky amber offline banner using @capacitor/network.
 * Mounts as a global overlay in App.tsx — automatically appears/disappears
 * when the device loses or regains connectivity.
 */
import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { WifiOff } from "lucide-react";

export function NetworkGuard() {
  const [offline, setOffline] = useState(false);
  const [visible, setVisible] = useState(false); // delayed mount for smooth animation

  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    async function init() {
      if (Capacitor.isNativePlatform()) {
        try {
          const { Network } = await import("@capacitor/network");

          // Check current status immediately
          const status = await Network.getStatus();
          const isOffline = !status.connected;
          setOffline(isOffline);
          if (isOffline) setVisible(true);

          // Listen for changes
          const handle = await Network.addListener("networkStatusChange", (s) => {
            const nowOffline = !s.connected;
            setOffline(nowOffline);
            if (nowOffline) {
              setVisible(true);
            } else {
              // Keep banner visible briefly on reconnect
              setTimeout(() => setVisible(false), 2000);
            }
          });

          unlistenFn = () => handle.remove();
        } catch (err) {
          console.warn("[NetworkGuard] Network plugin not available:", err);
        }
      } else {
        // Web fallback using browser events
        const handleOffline = () => { setOffline(true); setVisible(true); };
        const handleOnline = () => {
          setOffline(false);
          setTimeout(() => setVisible(false), 2000);
        };
        window.addEventListener("offline", handleOffline);
        window.addEventListener("online", handleOnline);
        unlistenFn = () => {
          window.removeEventListener("offline", handleOffline);
          window.removeEventListener("online", handleOnline);
        };
      }
    }

    init();
    return () => { unlistenFn?.(); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-all duration-500 ${
        offline
          ? "bg-amber-500 text-amber-950 translate-y-0 opacity-100"
          : "bg-green-500 text-white translate-y-0 opacity-100"
      }`}
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 10px)" }}
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        {offline
          ? "Connection lost — some features may be unavailable"
          : "✓ Back online"}
      </span>
    </div>
  );
}
