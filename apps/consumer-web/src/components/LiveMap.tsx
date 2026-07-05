/**
 * Reusable Leaflet map (OpenStreetMap tiles -no API key). Renders a vendor
 * marker and/or a destination marker and auto-fits the view. Used on both the
 * consumer order-tracking screen and the vendor active-order screen.
 */
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface LatLng { lat: number; lng: number }

// Inline SVG pin icons (avoid broken default marker asset paths under Vite).
const pin = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="transform:translate(-50%,-100%)"><svg width="34" height="34" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5"><path d="M12 2C7.9 2 4.5 5.4 4.5 9.5c0 5.3 6.3 11.6 7 12.2.3.3.7.3 1 0 .7-.6 7-6.9 7-12.2C19.5 5.4 16.1 2 12 2z"/><circle cx="12" cy="9.5" r="2.6" fill="white"/></svg></div>`,
    iconSize: [34, 34],
  });

const VENDOR_ICON = pin("#1B6EF3");
const DEST_ICON = pin("#E11D48");

export function LiveMap({
  vendor,
  destination,
  className = "w-full h-full",
}: {
  vendor?: LatLng | null;
  destination?: LatLng | null;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vMarker = useRef<L.Marker | null>(null);
  const dMarker = useRef<L.Marker | null>(null);
  const line = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const center = vendor ?? destination ?? { lat: 23.588, lng: 58.3829 };
    const map = L.map(elRef.current, { zoomControl: false, attributionControl: false }).setView([center.lat, center.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (vendor) {
      if (!vMarker.current) vMarker.current = L.marker([vendor.lat, vendor.lng], { icon: VENDOR_ICON }).addTo(map);
      else vMarker.current.setLatLng([vendor.lat, vendor.lng]);
    }
    if (destination) {
      if (!dMarker.current) dMarker.current = L.marker([destination.lat, destination.lng], { icon: DEST_ICON }).addTo(map);
      else dMarker.current.setLatLng([destination.lat, destination.lng]);
    }
    if (vendor && destination) {
      const pts: L.LatLngExpression[] = [[vendor.lat, vendor.lng], [destination.lat, destination.lng]];
      if (!line.current) line.current = L.polyline(pts, { color: "#1B6EF3", weight: 3, dashArray: "6 8", opacity: 0.7 }).addTo(map);
      else line.current.setLatLngs(pts);
      map.fitBounds(L.latLngBounds(pts as any).pad(0.4));
    } else if (vendor) {
      map.setView([vendor.lat, vendor.lng], 15, { animate: true });
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 15, { animate: true });
    }
  }, [vendor?.lat, vendor?.lng, destination?.lat, destination?.lng]);

  return <div ref={elRef} className={className} />;
}
