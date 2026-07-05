import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { Bell, ChevronLeft, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function ConsumerNotifications() {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try { setItems(await api.notifications()); } catch { setItems([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const markAll = async () => {
    setBusy(true);
    try { await api.markNotificationsRead(); await load(); } catch { /**/ } finally { setBusy(false); }
  };

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-5 rounded-b-3xl shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")}><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="text-xl font-extrabold">Notifications</h1>
        </div>
        {items.some((n) => !n.read_at) && (
          <button onClick={markAll} disabled={busy} className="text-xs font-bold bg-white/15 px-3 py-1.5 rounded-full flex items-center gap-1">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      <div className="px-4 py-5 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : items.map((n, i) => (
          <div key={n.notification_id ?? i} className={`bg-card border rounded-2xl p-4 shadow-sm flex gap-3 ${n.read_at ? "border-border" : "border-primary/40"}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.read_at ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
              <Bell className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm">{n.title ?? n.kind?.replace(/_/g, " ") ?? "Notification"}</p>
              {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
              {n.created_at && <p className="text-[11px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>}
            </div>
            {!n.read_at && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5 ms-auto" />}
          </div>
        ))}
        <Button variant="ghost" onClick={() => navigate("/profile")} className="w-full text-muted-foreground">Back to profile</Button>
      </div>
    </ConsumerLayout>
  );
}
