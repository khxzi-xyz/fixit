import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { supabase } from "@/lib/supabase";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Coordinate {
  lat: number;
  lng: number;
}

// A sub-component to smoothly pan the map
function MapUpdater({ position }: { position: Coordinate | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [position, map]);
  return null;
}

export function OrderMapTracker({ jobId }: { jobId: string }) {
  const [riderPosition, setRiderPosition] = useState<Coordinate | null>(null);

  useEffect(() => {
    if (!jobId) return;

    // Fetch initial location
    supabase
      .from("rider_locations")
      .select("latitude, longitude")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setRiderPosition({ lat: data.latitude, lng: data.longitude });
        }
      });

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`rider_tracking_${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT and UPDATE
          schema: "public",
          table: "rider_locations",
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const newDoc = payload.new as any;
          if (newDoc && newDoc.latitude && newDoc.longitude) {
            setRiderPosition({ lat: newDoc.latitude, lng: newDoc.longitude });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  if (!riderPosition) {
    return (
      <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl flex items-center justify-center">
        <p className="text-muted-foreground font-medium">Waiting for rider location...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-64 rounded-2xl overflow-hidden relative border border-border shadow-sm">
      <MapContainer
        center={[riderPosition.lat, riderPosition.lng]}
        zoom={15}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater position={riderPosition} />
        <Marker position={[riderPosition.lat, riderPosition.lng]}>
          <Popup>Rider is here</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
