import { useEffect } from "react";
import { io } from "socket.io-client";
import { LocalNotifications } from "@capacitor/local-notifications";
import { getToken } from "@/lib/api";

export function NotificationManager() {
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    // Connect to the NestJS backend
    const socket = io("https://fixit-backend-url.onrender.com", {
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
