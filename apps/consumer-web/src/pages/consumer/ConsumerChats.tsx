import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { api } from "@/lib/api";
import { MessageCircle, Sparkles, ChevronRight, Briefcase } from "lucide-react";

/** Chats hub: the permanent FixIt Support (AI) thread pinned on top, then job chats. */
export default function ConsumerChats() {
  const [, navigate] = useLocation();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    api.myJobs()
      .then((j) => setJobs(j.filter((x: any) => ["ASSIGNED", "IN_PROGRESS", "VENDOR_MARKED_COMPLETE"].includes(x.status))))
      .catch(() => setJobs([]));
  }, []);

  return (
    <ConsumerLayout>
      <div className="sticky top-0 z-40 hero-blue text-white px-4 pt-4 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-xl font-extrabold flex items-center gap-2"><MessageCircle className="w-5 h-5"/> Chats</h1>
        <p className="text-white/75 mt-1 text-sm">Your active conversations</p>
      </div>

      <div className="p-4 space-y-3">
        {/* Pinned: permanent AI support chat */}
        <button
          onClick={() => navigate("/support/chat")}
          className="w-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/25 rounded-2xl p-4 flex items-center gap-3 text-left hover:border-primary/50 transition-colors"
        >
          <div className="relative shrink-0">
            <img src="/logo.png" alt="" className="w-12 h-12 rounded-xl shadow" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 border-2 border-background rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-sm flex items-center gap-1.5">
              FixIt Support <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span className="px-1.5 py-0.5 bg-primary/15 text-primary text-[9px] font-black rounded-full uppercase">AI + Agents</span>
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">Always online · instant answers about jobs, refunds & plans</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>

        {/* Job conversations */}
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary">
              <MessageCircle className="w-10 h-10" />
            </div>
            <div>
              <h2 className="font-bold text-lg mb-1">No Active Job Chats</h2>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto">When you assign a vendor to a job, your chat will appear here.</p>
            </div>
          </div>
        ) : (
          jobs.map((j) => (
            <button
              key={j.job_id}
              onClick={() => navigate(`/order/${j.job_id}`)}
              className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-3 text-left hover:border-primary/40 transition-colors"
            >
              <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{j.description?.slice(0, 40) || j.category_id}</p>
                <p className="text-xs text-muted-foreground capitalize">{String(j.status).replace(/_/g, " ").toLowerCase()}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))
        )}
      </div>
    </ConsumerLayout>
  );
}
