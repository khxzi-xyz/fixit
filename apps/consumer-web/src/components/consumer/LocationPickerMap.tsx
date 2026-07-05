import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LatLng { lat: number; lng: number; address?: string }

const pin = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%)"><svg width="38" height="38" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><path d="M12 2C7.9 2 4.5 5.4 4.5 9.5c0 5.3 6.3 11.6 7 12.2.3.3.7.3 1 0 .7-.6 7-6.9 7-12.2C19.5 5.4 16.1 2 12 2z"/><circle cx="12" cy="9.5" r="2.6" fill="white"/></svg></div>`,
    iconSize: [38, 38],
  });

export function LocationPickerMap({
  initialLocation = { lat: 23.588, lng: 58.3829 }, // Default Muscat
  onLocationChange,
  className = "w-full h-[400px]",
}: {
  initialLocation?: LatLng;
  onLocationChange?: (loc: LatLng) => void;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const searchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim() || !mapRef.current || !markerRef.current) return;
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        mapRef.current.setView([lat, lng], 15);
        markerRef.current.setLatLng([lat, lng]);
        onLocationChange?.({ lat, lng, address: data[0].display_name });
      }
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, { zoomControl: false, attributionControl: false }).setView([initialLocation.lat, initialLocation.lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    mapRef.current = map;

    const marker = L.marker([initialLocation.lat, initialLocation.lng], {
      icon: pin("#E11D48"),
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    const updateLoc = async (lat: number, lng: number) => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
        const data = await res.json();
        const address = data.display_name || "Unknown location";
        onLocationChange?.({ lat, lng, address });
      } catch {
        onLocationChange?.({ lat, lng });
      } finally {
        setLoading(false);
      }
    };

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      map.setView(pos);
      updateLoc(pos.lat, pos.lng);
    });

    map.on("click", (e) => {
      marker.setLatLng(e.latlng);
      map.setView(e.latlng);
      updateLoc(e.latlng.lat, e.latlng.lng);
    });

    // Initial fetch
    updateLoc(initialLocation.lat, initialLocation.lng);

    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border ${className}`}>
      <div ref={elRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 right-3 z-[1000] drop-shadow-md">
        <form onSubmit={searchLocation} className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city, neighborhood..."
            className="flex-1 h-12 px-4 rounded-xl text-sm border-none shadow-sm focus:ring-2 focus:ring-primary text-black outline-none"
          />
          <button type="submit" className="h-12 px-4 rounded-xl bg-primary text-white font-bold shadow-sm">
            Search
          </button>
        </form>
      </div>
      {loading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur text-primary text-xs font-bold px-3 py-1.5 rounded-full shadow-sm z-[1000]">
          Locating...
        </div>
      )}
      <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 backdrop-blur p-3 rounded-xl shadow-lg border border-border flex items-center gap-2 pointer-events-none">
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary"><path d="M12 2v4m0 12v4M2 12h4m12 0h4m-12 0a4 4 0 108 0 4 4 0 10-8 0"/></svg>
        </div>
        <p className="text-xs font-medium text-foreground leading-tight">Drag the map or pin to set exact location</p>
      </div>
    </div>
  );
}
