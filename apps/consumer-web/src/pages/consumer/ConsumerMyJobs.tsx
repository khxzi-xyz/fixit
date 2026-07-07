import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { ChevronLeft, Clock, CheckCircle2, ShieldAlert, Wrench, XCircle, Zap, FileEdit, RefreshCw } from "lucide-react";
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
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PAST" | "DRAFTS">("ALL");
  const [busy, setBusy] = useState(true);
  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    import("@/lib/api").then(({ swr }) => {
      swr("my_jobs", api.myJobs, (data) => {
        setJobs(Array.isArray(data) ? data : []);
        setBusy(false);
      }).catch(() => setBusy(false));
    });

    // Load any saved draft
    try {
      const saved = localStorage.getItem("fixit_job_draft");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.selectedCat || d.description) setDraft(d);
      }
    } catch {}
  }, []);

  const repostJob = (j: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    localStorage.setItem("fixit_job_draft", JSON.stringify({
      step: "details",
      selectedCat: j.category_id,
      urgency: "FLEXIBLE",
      description: j.description,
      bounty: j.bounty_price || "",
      useBounty: j.posting_kind === "BOUNTY",
      lat: j.location_lat,
      lng: j.location_lng
    }));
    navigate("/post-job");
  };

  const filtered = jobs.filter((j) => {
    if (filter === "ACTIVE") return ["OPEN", "ASSIGNED", "IN_PROGRESS", "PENDING_REVIEW"].includes(j.status);
    if (filter === "PAST") return ["COMPLETED", "CANCELLED"].includes(j.status);
    return true;
  });

  const tabs: { key: "ALL" | "ACTIVE" | "PAST" | "DRAFTS"; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "ACTIVE", label: "Active" },
    { key: "PAST", label: "Past" },
    { key: "DRAFTS", label: draft ? "Draft 🟡" : "Drafts" },
  ];

  return (
    <ConsumerLayout>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground border-b border-border text-white px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate("/home")} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-extrabold flex-1">My Jobs</h1>
          <button
            onClick={() => navigate("/post-job")}
            className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-all"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
        <p className="text-white/80 text-sm mb-4 px-1">{jobs.length} total request{jobs.length !== 1 ? "s" : ""}</p>

        <div className="flex bg-white/20 rounded-full p-1 gap-1 shadow-sm mx-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-full transition-all ${filter === t.key ? "bg-white text-primary shadow" : "text-white/90 hover:text-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-5 pb-24 space-y-4">
        {/* DRAFTS TAB */}
        {filter === "DRAFTS" && (
          draft ? (
            <div className="bg-yellow-500/10 border-2 border-yellow-500/40 rounded-full p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-yellow-500/20 rounded-full flex items-center justify-center">
                    <FileEdit className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Saved Draft</p>
                    <p className="text-xs text-muted-foreground">{draft.selectedCat || "Service"} · {draft.step === "review" ? "Ready to post" : "In progress"}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-[9px] font-bold uppercase rounded-full">Draft</span>
              </div>
              {draft.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{draft.description}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/post-job")}
                  className="flex-1 h-10 bg-primary text-white font-bold rounded-full flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  Continue Posting
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("fixit_job_draft");
                    setDraft(null);
                  }}
                  className="h-10 px-4 border border-border rounded-full font-bold text-muted-foreground hover:bg-muted/40 text-sm"
                >
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-full p-8 text-center">
              <FileEdit className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-bold text-base mb-1">No Saved Drafts</p>
              <p className="text-xs text-muted-foreground mb-4">Start posting a job and it'll auto-save here.</p>
              <button onClick={() => navigate("/post-job")} className="px-6 h-10 bg-primary text-white font-bold rounded-full text-sm">
                Post a Job
              </button>
            </div>
          )
        )}

        {/* REGULAR TABS */}
        {filter !== "DRAFTS" && (
          busy ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-full p-4 h-28 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-card border border-border rounded-full shadow-sm p-6 text-center flex flex-col items-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-3">
                <Wrench className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="font-bold text-base mb-1">No jobs found</p>
              <p className="text-xs text-muted-foreground mb-4">
                {filter === "ACTIVE" ? "You have no active jobs right now." : filter === "PAST" ? "No completed or cancelled jobs yet." : "You haven't posted any jobs yet."}
              </p>
              <button
                onClick={() => navigate("/post-job")}
                className="w-full h-10 bg-primary text-white font-bold rounded-full flex items-center justify-center shadow-sm"
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
                const isPast = ["COMPLETED", "CANCELLED"].includes(j.status);

                return (
                  <Link key={j.job_id} href={isActionable ? `/job/${j.job_id}/bids` : `/order/${j.job_id}`}>
                    <div className="bg-card border border-border rounded-full p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${status.bg} ${status.color}`}>
                              <Icon className="w-3 h-3" /> {status.label}
                            </span>
                            {j.posting_kind === "BOUNTY" && (
                              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 text-[9px] font-black rounded-full">Fixed Price</span>
                            )}
                          </div>
                          <h3 className="font-bold text-sm leading-snug line-clamp-2">
                            {j.tracking_id ? <span className="text-primary/70 font-mono text-[11px] mr-1 block">{j.tracking_id}</span> : null}
                            {j.description || `${j.category_id} Service Request`}
                          </h3>
                        </div>
                        {j.bounty_price && (
                          <span className="font-black text-primary text-sm shrink-0">{j.bounty_price} OMR</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPast && (
                            <button
                              onClick={(e) => repostJob(j, e)}
                              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors"
                            >
                              <RefreshCw className="w-3 h-3" /> Re-post
                            </button>
                          )}
                          <span className="text-xs font-bold text-primary">
                            {isActionable ? "View Bids →" : isPast ? "Details →" : "Track →"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>
    </ConsumerLayout>
  );
}
