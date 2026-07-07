import { useEffect } from "react";
import { io } from "socket.io-client";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getToken } from "@/lib/api";

export function NotificationManager() {
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const setupNotifications = async () => {
      try {
        const p = await LocalNotifications.requestPermissions();
        if (p.display !== 'granted') console.log('Notification permissions not granted');
      } catch (e) {
        console.warn('Failed to request permissions', e);
      }
    };
    setupNotifications();

    // Connect to the NestJS backend
    const socket = io("https://backend.fixit-now.xyz", {
      auth: { token },
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      console.log("Connected to notification server");
    });

    // Listen for new notifications
    socket.on("notification", async (data: { title: string; body: string; id?: string }) => {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: data.title,
            body: data.body,
            id: new Date().getTime(),
            schedule: { at: new Date(Date.now() + 1000) },
            actionTypeId: "",
            extra: null
          }
        ]
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return null;
}
