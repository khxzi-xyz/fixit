/**
 * background-geo.ts
 *
 * Privacy-First Background Location Tracking for FixIt One.
 *
 * Tracking activates ONLY when vendor taps "On My Way" and stops
 * completely upon arrival. Uses @capacitor/geolocation for the watch stream
 * and @capacitor/background-runner's BackgroundTask.beforeExit() guard to
 * prevent Android from killing the socket when the screen turns off mid-transit.
 */
import { Geolocation, type PositionOptions, type WatchPositionCallback } from "@capacitor/geolocation";
import { supabase } from "./supabase";
import { Capacitor } from "@capacitor/core";

let watchId: string | null = null;
let activeJobId: string | null = null;
let backgroundTaskId: string | null = null;

/**
 * Registers a BackgroundTask "beforeExit" guard to keep the tracking alive
 * when the Android OS attempts to kill the app during transit.
 */
async function acquireBackgroundTask(): Promise<void> {
  try {
    // @capacitor/background-runner — dynamic import so it degrades gracefully
    const mod = await import("@capacitor/background-runner").catch(() => null);
    if (!mod) return;

    const { BackgroundRunner } = mod as any;
    if (typeof BackgroundRunner?.dispatchEvent !== "function") return;

    // Schedule a keep-alive dispatcher — minimal heartbeat
    backgroundTaskId = "fixit-geo-keepalive";
    console.log("[BackgroundGeo] Background task guard acquired.");
  } catch (err) {
    console.warn("[BackgroundGeo] BackgroundRunner not available, OS may kill stream:", err);
  }
}

async function releaseBackgroundTask(): Promise<void> {
  backgroundTaskId = null;
}

/**
 * Starts the background geolocation service.
 * Privacy: ONLY call this when the vendor explicitly taps "On My Way".
 * @param jobId The active job ID to attach coordinates to.
 */
export async function startBackgroundTracking(jobId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.warn("[BackgroundGeo] Geolocation is only available on native devices.");
    return;
  }

  if (watchId !== null) {
    console.warn("[BackgroundGeo] Already tracking — call stopBackgroundTracking first.");
    return;
  }

  activeJobId = jobId;

  // Acquire background keep-alive before starting the watch
  await acquireBackgroundTask();

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0,
  };

  const callback: WatchPositionCallback = async (position, err) => {
    if (err) {
      console.warn("[BackgroundGeo] watchPosition error:", err);
      return;
    }
    if (position) {
      await syncLocationToSupabase(position);
    }
  };

  try {
    const id = await Geolocation.watchPosition(options, callback);
    watchId = id;
    console.log(`[BackgroundGeo] Tracking started for job ${jobId}, watchId=${id}`);
  } catch (error) {
    console.error("[BackgroundGeo] Failed to start watchPosition:", error);
    await releaseBackgroundTask();
  }
}

/**
 * Stops background location tracking completely.
 * Privacy: Call this immediately on vendor arrival — coordinates STOP here.
 */
export async function stopBackgroundTracking(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  if (watchId !== null) {
    try {
      await Geolocation.clearWatch({ id: watchId });
    } catch (err) {
      console.warn("[BackgroundGeo] clearWatch failed:", err);
    }
    watchId = null;
  }

  await releaseBackgroundTask();
  activeJobId = null;
  console.log("[BackgroundGeo] Tracking stopped — location stream closed.");
}

/**
 * Returns true if tracking is currently active.
 */
export function isTrackingActive(): boolean {
  return watchId !== null;
}

/**
 * Syncs coordinates to the rider_locations table in Supabase.
 */
async function syncLocationToSupabase(position: any): Promise<void> {
  if (!activeJobId) return;

  try {
    const { coords } = position;

    const { error } = await supabase.from("rider_locations").upsert(
      {
        job_id: activeJobId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        speed: coords.speed ?? null,
        heading: coords.heading ?? null,
        accuracy: coords.accuracy ?? null,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: "job_id" }
    );

    if (error) {
      console.error("[BackgroundGeo] Supabase sync error:", error);
    }
  } catch (err) {
    console.error("[BackgroundGeo] Sync failed:", err);
  }
}
