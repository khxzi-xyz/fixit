/**
 * Talabat-style consumer UI kit (FixIt Now blue brand).
 * Reusable building blocks: sticky location+search header, category tiles,
 * horizontal carousels, pro cards, promo hero, section headers.
 */
import { ReactNode } from "react";
import { Link } from "wouter";
import { ChevronRight, MapPin, Search, Star, ShieldCheck, Bell } from "lucide-react";
import { Drawer } from "vaul";
import { useState, useEffect } from "react";
import { LocationPickerMap } from "./LocationPickerMap";
import { api } from "@/lib/api";

/* Category icon images use lucide glyphs passed in; tiles below take an Icon. */
export function StickyHeader({
  location = "Al Seeb, Muscat",
  onSearchClick,
  searchTo = "/search",
  unread = 0,
}: {
  location?: string;
  onSearchClick?: () => void;
  searchTo?: string;
  unread?: number;
}) {
  const [open, setOpen] = useState(false);
  const [locName, setLocName] = useState(location);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);

  useEffect(() => { setLocName(location); }, [location]);

  useEffect(() => {
    if (open) {
      api.addresses().then((a) => {
        if (Array.isArray(a)) setSavedAddresses(a);
      }).catch(() => {});
    }
  }, [open]);

  return (
    <div className="sticky top-0 z-40 bg-primary text-primary-foreground border-b border-border text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-md">
      <div className="flex items-center justify-between mb-4">
        
        <Drawer.Root open={open} onOpenChange={setOpen}>
          <Drawer.Trigger asChild>
            <div className="min-w-0 cursor-pointer">
              <p className="text-[11px] uppercase tracking-wide text-white/70 font-medium">Deliver / Service to</p>
              <div className="flex items-center gap-1 font-bold text-lg truncate">
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">{locName}</span>
                <ChevronRight className="w-4 h-4 rotate-90 opacity-80" />
              </div>
            </div>
          </Drawer.Trigger>
          

          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
            <Drawer.Content className="bg-background flex flex-col rounded-t-[20px] mt-24 fixed bottom-0 left-0 right-0 z-50 h-[85vh]">
              <div className="p-4 bg-background rounded-t-[20px] flex-1 flex flex-col">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
                <Drawer.Title className="text-xl font-extrabold mb-4">Set exact location</Drawer.Title>
                <div className="flex-1 overflow-hidden rounded-full mb-4 relative">
                  <LocationPickerMap 
                    className="w-full h-full"
                    onLocationChange={(l) => {
                      if (l.address) {
                        setLocName(l.address.split(",")[0]);
                        // Optional: Store the full coordinate in state if needed to save
                        (window as any)._tempLoc = l;
                      }
                    }} 
                  />
                </div>
                <div className="flex-shrink-0 mb-4 mt-2">
                  {savedAddresses.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-bold text-muted-foreground mb-2 px-1">Saved Addresses</h4>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                        {savedAddresses.map((a: any) => (
                          <button key={a.id} onClick={() => {
                            setLocName(a.label || "Saved Location");
                            setOpen(false);
                          }} className="shrink-0 bg-muted px-4 py-2 rounded-full text-sm font-bold text-foreground border border-border whitespace-nowrap">
                            {a.label || "Saved"}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => {
                    setOpen(false);
                    const l = (window as any)._tempLoc;
                    if (l) {
                      api.addAddress(locName, l.address, l.lat, l.lng).catch(() => {});
                    }
                  }} className="w-full h-14 rounded-full bg-primary text-primary-foreground font-bold text-lg shadow-sm">
                    Confirm Location
                  </button>
                </div>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
        <div className="flex items-center gap-3">
          <img src="/logo-with-name(long).png" alt="FixIt Now Logo" className="h-8 w-auto object-contain brightness-0 invert" />
          <Link href="/notifications">
            <div className="relative w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center font-bold shrink-0">
              <Bell className="w-5 h-5" />
              {unread > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-[10px] font-bold flex items-center justify-center text-white">{unread}</span>}
            </div>
          </Link>
        </div>
      </div>

      {searchTo ? (
        <Link href={searchTo}>
          <div className="flex items-center gap-2 h-12 px-4 rounded-full bg-white text-muted-foreground shadow-sm cursor-text">
            <Search className="w-5 h-5 text-primary" />
            <span className="text-sm">Search services, pros, categories…</span>
          </div>
        </Link>
      ) : (
        <button onClick={onSearchClick} className="w-full flex items-center gap-2 h-12 px-4 rounded-full bg-white text-muted-foreground shadow-sm">
          <Search className="w-5 h-5 text-primary" />
          <span className="text-sm">Search services, pros, categories…</span>
        </button>
      )}
    </div>
  );
}

export function SectionHeader({ title, href, action = "See all" }: { title: string; href?: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="text-base font-extrabold tracking-tight text-foreground">{title}</h2>
      {href && (
        <Link href={href} className="text-sm text-primary font-semibold flex items-center gap-0.5">
          {action} <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

export function PromoHero({ title, subtitle, cta, href }: { title: string; subtitle: string; cta: string; href: string }) {
  return (
    <Link href={href}>
      <div className="relative overflow-hidden rounded-full p-5 bg-primary text-primary-foreground border-b border-border text-white shadow-md">
        <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -right-4 bottom-0 opacity-20">
          <img src="/logo-with-name(long).png" alt="FixIt Now Logo" className="w-28 h-auto object-contain grayscale" />
        </div>
        <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">{subtitle}</p>
        <h3 className="text-xl font-extrabold mt-1 max-w-[80%] leading-tight">{title}</h3>
        <span className="inline-flex mt-4 items-center gap-1 bg-white text-primary text-sm font-bold px-4 py-2 rounded-full">{cta} <ChevronRight className="w-4 h-4" /></span>
      </div>
    </Link>
  );
}

/** Horizontal scroll rail. */
export function Rail({ children }: { children: ReactNode }) {
  return <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">{children}</div>;
}

export function CategoryTile({ label, Icon, href, color = "primary" }: { label: string; Icon: any; href: string; color?: "primary" | "accent" | "success" | "warning" }) {
  const bg = { primary: "bg-slate-100 dark:bg-slate-800 text-primary", accent: "bg-accent/10 text-accent", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning" }[color];
  return (
    <Link href={href} className="flex-shrink-0 w-[76px] flex flex-col items-center gap-2">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${bg}`}>
        {typeof Icon === "string" ? <span className="text-3xl">{Icon}</span> : <Icon className="w-7 h-7" />}
      </div>
      <span className="text-[11px] font-semibold text-center text-foreground leading-tight line-clamp-2">{label}</span>
    </Link>
  );
}

/** Talabat restaurant-style card adapted to a service pro. */
export function ProCard({
  name,
  category,
  rating,
  jobs,
  eta,
  fee,
  verified,
  href,
  initials,
}: {
  name: string;
  category: string;
  rating?: number;
  jobs?: number;
  eta?: string;
  fee?: string;
  verified?: boolean;
  href: string;
  initials: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-card rounded-full border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative h-28 bg-primary text-primary-foreground border-b border-border flex items-center justify-center">
          <span className="text-3xl font-black text-white/90">{initials}</span>
          {verified && (
            <span className="absolute top-2 left-2 flex items-center gap-1 bg-white/95 text-success text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          )}
          {fee && <span className="absolute bottom-2 right-2 bg-white/95 text-foreground text-[11px] font-bold px-2 py-1 rounded-full shadow-sm">{fee}</span>}
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-sm truncate">{name}</h4>
            {typeof rating === "number" && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-foreground shrink-0">
                <Star className="w-3.5 h-3.5 fill-warning text-warning" /> {rating.toFixed(1)}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{category}</p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            {eta && <span>⏱ {eta}</span>}
            {typeof jobs === "number" && <span>{jobs} jobs done</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

/** Page section spacing wrapper used between rails/blocks. */
export function Stack({ children }: { children: ReactNode }) {
  return <div className="space-y-6 px-4 py-5">{children}</div>;
}

/** Vendor dashboard header: shop name + online/offline availability toggle. */
export function VendorHeader({
  shopName,
  online,
  onToggle,
  children,
}: {
  shopName: string;
  online: boolean;
  onToggle: (v: boolean) => void;
  children?: ReactNode;
}) {
  return (
    <div className="bg-primary text-primary-foreground border-b border-border text-white px-4 pt-5 pb-12 rounded-b-3xl shadow-md">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-white/70 font-medium">Welcome back</p>
          <h1 className="text-xl font-extrabold truncate">{shopName}</h1>
        </div>
        <button
          onClick={() => onToggle(!online)}
          className={`flex items-center gap-2 pl-3 pr-1 py-1 rounded-full text-xs font-bold transition-colors ${online ? "bg-success text-white" : "bg-white/15 text-white"}`}
        >
          {online ? "ONLINE" : "OFFLINE"}
          <span className={`w-6 h-6 rounded-full flex items-center justify-center ${online ? "bg-white" : "bg-white/30"}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${online ? "bg-success animate-pulse" : "bg-white"}`} />
          </span>
        </button>
      </div>
      {children}
    </div>
  );
}

/** Talabat-style job feed card for vendors. */
export function JobFeedCard({
  title,
  area,
  distance,
  time,
  urgency,
  bounty,
  href,
}: {
  title: string;
  area?: string;
  distance?: string;
  time?: string;
  urgency?: string;
  bounty?: string;
  href: string;
}) {
  const hot = String(urgency).toUpperCase() === "EMERGENCY" || String(urgency).toUpperCase() === "HIGH";
  return (
    <Link href={href}>
      <div className="bg-card rounded-full border border-border shadow-sm p-4 relative overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        {bounty && <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-[10px] font-bold px-3 py-1 rounded-bl-xl">BOUNTY · {bounty}</div>}
        <div className="flex items-center gap-2 mb-2">
          {hot && <span className="bg-destructive/10 text-destructive text-[10px] font-bold px-2 py-0.5 rounded uppercase">Urgent</span>}
          <h3 className="font-bold text-base leading-tight">{title}</h3>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3">
          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {area ?? "Muscat"}{distance ? ` · ${distance}` : ""}</span>
          {time && <span>{time}</span>}
        </div>
      </div>
    </Link>
  );
}
