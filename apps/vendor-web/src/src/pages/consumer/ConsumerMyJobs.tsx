import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { ChevronRight, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function ConsumerMyJobs() {
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
    if (filter === "PENDING") return j.status === "OPEN" || j.status === "PENDING_REVIEW";
    if (filter === "PROGRESS") return j.status === "IN_PROGRESS" || j.status === "ASSIGNED";
    if (filter === "DONE") return j.status === "COMPLETED";
    return true;
  });

  return (
    <ConsumerLayout>
      <div className="hero-blue text-white px-4 pt-5 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-extrabold">My Jobs</h1>
        <div className="flex gap-2 overflow-x-auto mt-4 no-scrollbar">
          {["ALL", "PENDING", "PROGRESS", "DONE"].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filter === f ? "bg-white text-primary" : "bg-white/10 text-white hover:bg-white/20"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {busy ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading jobs...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No jobs found in this category.</div>
        ) : (
          filtered.map((j) => (
            <Link key={j.job_id} href={`/job/${j.job_id}/tracking`} className="block bg-card border border-border rounded-2xl p-4 active:scale-[0.98] transition-transform">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-sm mb-1">{j.description ? j.description.slice(0, 50) + "..." : "Service Request"}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(j.created_at), { addSuffix: true })}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                {j.status === 'COMPLETED' ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3"/> Done</span> :
                 j.status === 'PENDING_REVIEW' ? <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full"><ShieldAlert className="w-3 h-3"/> Under Review</span> :
                 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>}
              </div>
            </Link>
          ))
        )}
      </div>
    </ConsumerLayout>
  );
}
