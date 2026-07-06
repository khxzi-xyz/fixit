import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { ChevronLeft, Clock, CheckCircle2, ShieldAlert, Wrench, XCircle, Zap, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_MAP: Record<string, { label: string, color: string, bg: string, icon: any }> = {
  OPEN: { label: "Bidding", color: "text-primary", bg: "bg-primary/10", icon: Zap },
  ASSIGNED: { label: "Assigned", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "text-orange-500", bg: "bg-orange-500/10", icon: Wrench },
  COMPLETED: { label: "Completed", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
  PENDING_REVIEW: { label: "Under Review", color: "text-purple-500", bg: "bg-purple-500/10", icon: ShieldAlert },
};

export default function ConsumerMyJobs() {
  const [, navigate] = useLocation();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    api.myJobs().then((data) => {
      setJobs(data);
      setBusy(false);
    }).catch(() => setBusy(false));
  }, []);

  const filtered = jobs.filter((j) => {
    if (filter === "ACTIVE") return ["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_REVIEW"].includes(j.status);
    if (filter === "PAST") return ["COMPLETED", "CANCELLED"].includes(j.status);
    return true;
  });

  return (
    <ConsumerLayout>
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground border-b border-border text-white px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/home")} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-extrabold flex-1">My Jobs</h1>
        </div>
        <p className="text-white/80 text-sm mb-4 px-1">{jobs.length} total request{jobs.length !== 1 ? "s" : ""}</p>

        <div className="flex bg-white/20 rounded-xl p-1 gap-1 shadow-sm mx-1">
          {(["ALL", "ACTIVE", "PAST"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${filter === f ? "bg-white text-primary shadow" : "text-white/90 hover:text-white"}`}
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 pb-24 space-y-4">
        {busy ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 h-28 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-bold text-base mb-1">No jobs found</p>
            <p className="text-xs text-muted-foreground mb-4">
              You haven't posted any jobs in this category yet.
            </p>
            <button
              onClick={() => navigate("/post-job")}
              className="w-full h-10 bg-primary text-white font-bold rounded-xl flex items-center justify-center shadow-sm"
            >
              Post a New Job
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((j) => {
              const status = STATUS_MAP[j.status] || STATUS_MAP.OPEN;
              const Icon = status.icon;
              const isActionable = j.status === "OPEN";

              return (
                <Link key={j.job_id} href={isActionable ? `/job/${j.job_id}/bids` : `/order/${j.job_id}`}>
                  <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${status.bg} ${status.color}`}>
                            <Icon className="w-3 h-3" /> {status.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm leading-snug line-clamp-2">
                          {j.description || `${j.category_id} Service Request`}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}</span>
                      </div>
                      <span className="text-xs font-bold text-primary">
                        {isActionable ? "View Bids →" : "Track Order →"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </ConsumerLayout>
  );
}
