import BackgroundGeolocation, {
  Location,
  Subscription,
} from "@transistorsoft/capacitor-background-geolocation";
import { supabase } from "./supabase";
import { Capacitor } from "@capacitor/core";

let onLocationSub: Subscription | null = null;
let activeJobId: string | null = null;

/**
 * Initializes and starts the background geolocation service.
 * @param jobId The active job ID to tie the location coordinates to.
 */
export async function startBackgroundTracking(jobId: string) {
  if (!Capacitor.isNativePlatform()) {
    console.warn("Background geolocation is only available on native devices.");
    return;
  }

  activeJobId = jobId;

  // Listen to location events
  onLocationSub = BackgroundGeolocation.onLocation(
    async (location: Location) => {
      console.log("[BackgroundGeolocation] location: ", location);
      await syncLocationToSupabase(location);
    },
    (error) => {
      console.warn("[BackgroundGeolocation] error: ", error);
    }
  );

  // Configure the plugin
  const state = await BackgroundGeolocation.ready({
    desiredAccuracy: 0, // HIGH
    distanceFilter: 10, // Minimum distance (meters) before updating
    stopOnTerminate: false, // Continue tracking after app is closed
    startOnBoot: true, // Start tracking when device reboots
    debug: false, // Disable debug sounds/notifications in production
    logLevel: 0, // OFF
    // Persistent Notification config for Android
    foregroundService: true,
    notificationTitle: "FixIt Active Job",
    notificationText: "Tracking your location to update the customer.",
    notificationColor: "#0F172A",
    notificationSmallIcon: "drawable/ic_stat_name", // Make sure this exists in res/drawable
  });

  if (!state.enabled) {
    await BackgroundGeolocation.start();
  }
}

/**
 * Stops background location tracking and removes listeners.
 */
export async function stopBackgroundTracking() {
  if (!Capacitor.isNativePlatform()) return;

  if (onLocationSub) {
    onLocationSub.remove();
    onLocationSub = null;
  }

  activeJobId = null;
  await BackgroundGeolocation.stop();
}

/**
 * Syncs the recorded location back to the `rider_locations` table in Supabase.
 */
async function syncLocationToSupabase(location: Location) {
  if (!activeJobId) return;

  try {
    const { coords } = location;
    
    // We do NOT require a session here because background tasks might wake up 
    // without full JS auth hydration if the app was killed. However, RLS policies 
    // might block it if we don't handle service role or JWT properly. 
    // Assuming RLS allows insert with valid job_id for active riders.
    
    const { error } = await supabase.from("rider_locations").insert({
      job_id: activeJobId,
      latitude: coords.latitude,
      longitude: coords.longitude,
      speed: coords.speed,
      heading: coords.heading,
      accuracy: coords.accuracy,
      // You can add timestamp from location.timestamp if needed
    });

    if (error) {
      console.error("[BackgroundGeolocation] Supabase sync error: ", error);
    }
  } catch (err) {
    console.error("[BackgroundGeolocation] Sync failed: ", err);
  }
}
