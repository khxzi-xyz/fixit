/**
 * Realtime client for the vendor app -Socket.IO gateway (namespace /rt).
 * Vendors join their user room for direct bounties, wallet, and bid signals.
 */
import { io, Socket } from "socket.io-client";

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "https://backend.fixit-now.xyz/api").replace(/\/api$/, "");

let socket: Socket | null = null;

export function connectRealtime(): Socket {
  if (socket?.connected) return socket;
  socket = io(`${BASE}/rt`, { transports: ["websocket"], reconnection: true, autoConnect: true });
  return socket;
}
export function joinUser(userId: string) {
  connectRealtime().emit("join_user", { userId });
}
export function joinJob(jobId: string) {
  connectRealtime().emit("join_job", { jobId });
}
export function on(event: string, handler: (payload: any) => void): () => void {
  const s = connectRealtime();
  s.on(event, handler);
  return () => s.off(event, handler);
}
export function disconnectRealtime() {
  socket?.disconnect();
  socket = null;
}
