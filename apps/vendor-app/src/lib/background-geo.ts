import { Geolocation, PositionOptions, WatchPositionCallback } from "@capacitor/geolocation";
import { supabase } from "./supabase";
import { Capacitor } from "@capacitor/core";

let watchId: string | null = null;
let activeJobId: string | null = null;

/**
 * Initializes and starts the background geolocation service.
 * Note: Switched to @capacitor/geolocation to avoid TransistorSoft license errors.
 * This runs in foreground, and relies on OS limits for background persistence.
 * @param jobId The active job ID to tie the location coordinates to.
 */
export async function startBackgroundTracking(jobId: string) {
  if (!Capacitor.isNativePlatform()) {
    console.warn("Geolocation is only available on native devices.");
    return;
  }

  activeJobId = jobId;

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  const callback: WatchPositionCallback = async (position, err) => {
    if (err) {
      console.warn("[Geolocation] error: ", err);
      return;
    }
    if (position) {
      console.log("[Geolocation] position: ", position);
      await syncLocationToSupabase(position);
    }
  };

  try {
    const id = await Geolocation.watchPosition(options, callback);
    watchId = id;
  } catch (error) {
    console.error("[Geolocation] Failed to start watchPosition", error);
  }
}

/**
 * Stops background location tracking and removes listeners.
 */
export async function stopBackgroundTracking() {
  if (!Capacitor.isNativePlatform()) return;

  if (watchId !== null) {
    await Geolocation.clearWatch({ id: watchId });
    watchId = null;
  }

  activeJobId = null;
}

/**
 * Syncs the recorded location back to the `rider_locations` table in Supabase.
 */
async function syncLocationToSupabase(position: any) {
  if (!activeJobId) return;

  try {
    const { coords } = position;
    
    const { error } = await supabase.from("rider_locations").insert({
      job_id: activeJobId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      speed: coords.speed,
      heading: coords.heading,
      accuracy: coords.accuracy,
    });

    if (error) {
      console.error("[Geolocation] Supabase sync error: ", error);
    }
  } catch (err) {
    console.error("[Geolocation] Sync failed: ", err);
  }
}
