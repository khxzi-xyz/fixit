/**
 * Device location helper. Asks for permission and returns the current coords;
 * falls back to Muscat city centre if denied/unavailable. Works on web (browser
 * geolocation) and native (expo-location).
 */
import * as Location from "expo-location";

export const MUSCAT = { lat: 23.588, lng: 58.3829 };

let cached: { lat: number; lng: number } | null = null;

export async function getLocation(): Promise<{ lat: number; lng: number }> {
  if (cached) return cached;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return MUSCAT;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    cached = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    return cached;
  } catch {
    return MUSCAT;
  }
}
