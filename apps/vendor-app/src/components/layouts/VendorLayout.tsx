import { Link, useLocation } from "wouter";
import { Home, Briefcase, Wallet, User, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

export function VendorLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const watchId = useRef<string | null>(null);

  // Background Location tracking
  useEffect(() => {
    let active = true;
    const startTracking = async () => {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const perm = await Geolocation.requestPermissions();
        if (perm.location === 'granted' || perm.coarseLocation === 'granted') {
          // Push initial location
          const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
          if (active) api.updateLocation(pos.coords.latitude, pos.coords.longitude).catch(() => {});

          // Watch position changes
          const id = await Geolocation.watchPosition(
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 },
            (position, err) => {
              if (err || !position || !active) return;
              api.updateLocation(position.coords.latitude, position.coords.longitude).catch(() => {});
            }
          );
          if (active) watchId.current = id;
        }
      } catch (err) {
        console.warn("[Background Geo] failed", err);
      }
    };
    
    startTracking();

    return () => {
      active = false;
      if (watchId.current) {
        import('@capacitor/geolocation').then(({ Geolocation }) => {
          Geolocation.clearWatch({ id: watchId.current! });
        }).catch(() => {});
      }
    };
  }, []);

  const left = [
    { href: "/vendor/home", icon: Home, label: "Dashboard" },
    { href: "/vendor/jobs", icon: Briefcase, label: "Jobs" },
  ];
  const right = [
    { href: "/vendor/wallet", icon: Wallet, label: "Earnings" },
    { href: "/vendor/profile", icon: User, label: "Profile" },
  ];

  const Item = ({ href, icon: Icon, label }: { href: string; icon: any; label: string }) => {
    const active = location.startsWith(href);
    return (
      <Link href={href} className="flex flex-col items-center gap-0.5 flex-1 min-w-0 cursor-pointer active:scale-95 transition-transform">
        <Icon className={`w-6 h-6 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={active ? 2.5 : 2} />
        <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-800/50 safe-area-bottom pb-2">
        <div className="relative flex items-center px-2 py-2">
          {left.map((i) => <Item key={i.href} {...i} />)}
          <div className="flex-1 flex justify-center">
            <Link href="/vendor/jobs" className="relative -mt-8">
              <div className="w-14 h-14 rounded-full hero-blue text-white flex items-center justify-center shadow-lg ring-4 ring-background transform transition-transform hover:scale-105 active:scale-95">
                <Search className="w-7 h-7" strokeWidth={2.5} />
              </div>
            </Link>
          </div>
          {right.map((i) => <Item key={i.href} {...i} />)}
        </div>
      </nav>
    </div>
  );
}
