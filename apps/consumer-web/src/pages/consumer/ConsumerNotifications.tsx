import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, Bell, BellOff, CheckCheck, Briefcase, MessageCircle,
  Wallet, Gift, AlertCircle, Info, Zap, ChevronRight,
} from "lucide-react";

const NOTIF_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  JOB_UPDATE: { icon: Briefcase, color: "text-primary", bg: "bg-blue-500/15" },
  BID_RECEIVED: { icon: Zap, color: "text-yellow-400", bg: "bg-yellow-500/15" },
  BID_SELECTED: { icon: CheckCheck, color: "text-green-400", bg: "bg-green-500/15" },
  MESSAGE: { icon: MessageCircle, color: "text-purple-400", bg: "bg-purple-500/15" },
  PAYMENT: { icon: Wallet, color: "text-emerald-400", bg: "bg-emerald-500/15" },
  REWARD: { icon: Gift, color: "text-pink-400", bg: "bg-pink-500/15" },
  ALERT: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/15" },
  SYSTEM: { icon: Info, color: "text-slate-400", bg: "bg-slate-500/15" },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ConsumerNotifications() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    api.notifications()
      .then(setNotifications)
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      toast({ title: "All notifications marked as read" });
    } catch {
      toast({ title: "Couldn't mark as read", variant: "destructive" });
    } finally {
      setMarkingAll(false);
    }
  };

  const markOne = async (id: string) => {
    try {
      await api.markOneRead(id);
      setNotifications((prev) => prev.map((n) => n.notification_id === id ? { ...n, read_at: new Date().toISOString() } : n));
    } catch { /**/ }
  };

  const displayed = filter === "unread"
    ? notifications.filter((n) => !n.read_at)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const items = displayed;

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="bg-primary text-primary-foreground border-b border-border px-4 pt-10 pb-14">
        <div className="flex items-center justify-between mb-1">
          <button onClick={() => navigate("/profile")} className="flex items-center gap-2 text-white/80 hover:text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 border border-white/20 rounded-xl text-white text-xs font-bold hover:bg-white/20 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-black rounded-full">{unreadCount}</span>
          )}
        </div>
      </div>

      <div className="px-4 -mt-6 pb-10 space-y-3">
        {/* Filter tabs */}
        <div className="flex bg-card border border-border rounded-2xl p-1 gap-1">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all capitalize ${filter === f ? "bg-primary text-white shadow" : "text-muted-foreground hover:text-foreground"}`}
            >
              {f} {f === "unread" && unreadCount > 0 ? `(${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-muted rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                    <div className="h-2 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              <BellOff className="w-10 h-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-base">No notifications yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {filter === "unread" ? "You're all caught up! No unread notifications." : "Notifications about your jobs and account will appear here."}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((n: any) => {
              const cfg = NOTIF_CONFIG[n.kind] ?? NOTIF_CONFIG.SYSTEM;
              const Icon = cfg.icon;
              const isUnread = !n.read_at;

              return (
                <button
                  key={n.notification_id}
                  onClick={() => {
                    markOne(n.notification_id);
                    if (n.action_url) navigate(n.action_url);
                  }}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${
                    isUnread
                      ? "bg-slate-50 dark:bg-slate-900 border-primary/20 hover:bg-primary/10"
                      : "bg-card border-border hover:bg-muted/30"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    <Icon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-${isUnread ? "bold" : "semibold"} leading-tight`}>{n.title}</p>
                      {isUnread && <div className="w-2 h-2 bg-primary rounded-full mt-1 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1.5 font-medium">{timeAgo(n.created_at)}</p>
                  </div>
                  {n.action_url && <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Push notification enable prompt */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/15 rounded-xl flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">Enable Push Notifications</p>
            <p className="text-xs text-muted-foreground">Get real-time alerts even when the app is closed</p>
          </div>
          <button
            onClick={() => api.registerPushNotifications()}
            className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shrink-0"
          >
            Enable
          </button>
        </div>
      </div>
    </ConsumerLayout>
  );
}
