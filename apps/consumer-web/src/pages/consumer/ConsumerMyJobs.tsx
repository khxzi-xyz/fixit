import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { PullToRefresh } from "@/components/PullToRefresh";
import { ChevronLeft, Clock, CheckCircle2, ShieldAlert, Wrench, XCircle, Zap, FileEdit, RefreshCw, ChevronRight } from "lucide-react";
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
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [jobs, setJobs] = useState<any[]>([]);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "PAST" | "DRAFTS">("ALL");
  const [busy, setBusy] = useState(true);
  const [draft, setDraft] = useState<any>(null);

  const loadData = () => {
    return new Promise<void>((resolve) => {
      import("@/lib/api").then(({ swr }) => {
        swr("my_jobs", api.myJobs, (data) => {
          setJobs(Array.isArray(data) ? data : []);
          setBusy(false);
          resolve();
        }).catch(() => { setBusy(false); resolve(); });
      });
    });
  };

  useEffect(() => {
    loadData();

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
    { key: "ALL", label: t("jobs.all") },
    { key: "ACTIVE", label: t("jobs.active") },
    { key: "PAST", label: t("jobs.past") },
    { key: "DRAFTS", label: t("jobs.drafts") },
  ];

  return (
    <ConsumerLayout>
      <PullToRefresh onRefresh={async () => { await queryClient.invalidateQueries(); await loadData(); }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground pt-[env(safe-area-inset-top,2rem)] pb-4 px-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-black tracking-tight">{t("jobs.myJobs")}</h1>
          <button
            onClick={() => navigate("/post-job")}
            className="w-9 h-9 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center transition-all"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>

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
                {t("jobs.postNew")}
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
              <div className="w-24 h-24 flex items-center justify-center mb-3">
                <img src="/icons/empty_jobs.png" className="w-full h-full object-contain opacity-80 mix-blend-multiply dark:mix-blend-screen" alt="No Jobs" />
              </div>
              <p className="font-bold text-base mb-1">{t("jobs.noJobs")}</p>
              <p className="text-xs text-muted-foreground mb-4">
                {filter === "ACTIVE" ? "You have no active jobs right now." : filter === "PAST" ? "No completed or cancelled jobs yet." : "You haven't posted any jobs yet."}
              </p>
              <button
                onClick={() => navigate("/post-job")}
                className="w-full h-10 bg-primary text-white font-bold rounded-full flex items-center justify-center shadow-sm"
              >
                {t("jobs.postNew")}
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
                            <span className="text-primary/70 font-mono text-[11px] mr-1 block">#{j.short_id || j.job_id?.substring(0, 8).toUpperCase()}</span>
                            {j.description || `${j.category_id} Service Request`}
                          </h3>
                        </div>
                        <div className="text-right shrink-0">
                          {j.bounty_price && (
                            <p className="font-black text-sm text-primary">{Number(j.bounty_price).toFixed(2)}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <div className="flex -space-x-2">
                          {isActionable ? (
                            <>
                              {[1, 2, 3].slice(0, Math.min(3, j.bid_count || 1)).map((i) => (
                                <div key={i} className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground z-10">
                                  ?
                                </div>
                              ))}
                              {j.bid_count > 0 ? (
                                <span className="pl-3 text-[10px] font-bold text-primary">{j.bid_count} bid{j.bid_count !== 1 ? "s" : ""}</span>
                              ) : (
                                <span className="pl-3 text-[10px] font-medium text-muted-foreground">Finding pros...</span>
                              )}
                            </>
                          ) : j.assigned_vendor ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                {j.assigned_vendor.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs font-bold">{j.assigned_vendor}</span>
                            </div>
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground capitalize">{status.label}</span>
                          )}
                        </div>

                        {isActionable ? (
                          <button className="h-8 px-4 bg-primary text-white text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                            {t("jobs.viewBids")} <ChevronRight className="w-3 h-3" />
                          </button>
                        ) : isPast ? (
                          <button onClick={(e) => repostJob(j, e)} className="h-8 px-4 bg-muted text-foreground text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1 hover:bg-muted/80">
                            <RefreshCw className="w-3 h-3" /> {t("jobs.repost")}
                          </button>
                        ) : (
                          <button className="h-8 px-4 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
                            {t("jobs.track")} <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        )}
      </div>
      </PullToRefresh>
    </ConsumerLayout>
  );
}
