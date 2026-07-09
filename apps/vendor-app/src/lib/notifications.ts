import { Capacitor } from "@capacitor/core";
import { supabase } from "./supabase";

export async function setupPushNotifications() {
  if (!Capacitor.isNativePlatform()) return;

  // Register for push notifications
  let PushNotifications: any;
  try {
    const mod = await import("@capacitor/push-notifications");
    PushNotifications = mod.PushNotifications;
    await PushNotifications.register();
  } catch (error) {
    console.error("Failed to register for push notifications:", error);
    return;
  }

  // On success, we should be able to receive notifications
  PushNotifications.addListener("registration", async (token: any) => {
    console.log("Push registration success, token: " + token.value);
    await syncFCMToken(token.value);
  });

  // Some issue with our setup and push will fail
  PushNotifications.addListener("registrationError", (error: any) => {
    console.error("Error on registration: " + JSON.stringify(error));
  });

  // Show us the notification payload if the app is open on our device
  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Push received: ", notification);
  });

  // Method called when tapping on a notification
  PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
    console.log("Push action performed: ", notification);
  });
}

/**
 * Syncs the FCM token with Supabase `user_devices` table.
 */
async function syncFCMToken(fcmToken: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return;

    const platform = Capacitor.getPlatform();

    const { error } = await supabase.from("user_devices").upsert(
      { 
        user_id: userId, 
        fcm_token: fcmToken, 
        platform: platform, 
        last_active: new Date().toISOString() 
      },
      { onConflict: "fcm_token" }
    );

    if (error) {
      console.error("Failed to sync FCM token to Supabase:", error);
    } else {
      console.log("FCM token synced successfully to user_devices.");
    }
  } catch (err) {
    console.error("Error syncing FCM token:", err);
  }
}
