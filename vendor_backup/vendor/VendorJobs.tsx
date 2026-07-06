import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { VendorLayout } from "@/components/layouts/VendorLayout";
import { ChevronLeft } from "lucide-react";
import { JobFeedCard } from "@/components/consumer/talabat-kit";
import { api } from "@/lib/api";
import { useTranslated } from "@/lib/useTranslated";

function timeAgo(iso?: string) {
  if (!iso) return "";
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

export default function VendorJobs() {
  const [feed, setFeed] = useState<any[]>([]);
  const [cats, setCats] = useState<{ category_id: string; display_name: string }[]>([]);
  const [active, setActive] = useState("All");

  useEffect(() => {
    api.feed().then((f) => setFeed(Array.isArray(f) ? f : [])).catch(() => { });
    api.categories().then(setCats).catch(() => { });
  }, []);

  const filtered = useMemo(
    () => (active === "All" ? feed : feed.filter((j) => String(j.category_id).toUpperCase() === active.toUpperCase())),
    [feed, active],
  );
  const titles = useTranslated(filtered.map((j) => j.description?.slice(0, 44) || j.category_id));

  return (
    <VendorLayout>
      <div className="sticky top-0 z-40 hero-blue text-white px-4 pt-5 pb-5 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <Link href="/vendor/home"><ChevronLeft className="w-6 h-6" /></Link>
          <div>
            <h1 className="text-xl font-extrabold">Job Feed</h1>
            <p className="text-xs text-white/70">{filtered.length} open job{filtered.length === 1 ? "" : "s"} near you</p>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {["All", ...cats.map((c) => c.display_name)].map((label, i) => {
            const id = i === 0 ? "All" : cats[i - 1].category_id;
            const isActive = active === (i === 0 ? "All" : id);
            return (
              <button key={label} onClick={() => setActive(i === 0 ? "All" : id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-colors ${isActive ? "bg-white text-primary" : "bg-white/15 text-white"}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-5 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open jobs right now -check back soon.</p>
        ) : filtered.map((job, i) => (
          <JobFeedCard key={job.job_id}
            title={titles[i] || job.description?.slice(0, 44) || job.category_id}
            area="Muscat"
            distance={job.distance_km ? `${Number(job.distance_km).toFixed(1)} km` : undefined}
            time={timeAgo(job.created_at)}
            urgency={job.urgency}
            bounty={job.posting_kind === "BOUNTY" && job.bounty_price ? `${Number(job.bounty_price).toFixed(0)} OMR` : undefined}
            href={`/vendor/jobs/${job.job_id}`} />
        ))}
      </div>
    </VendorLayout>
  );
}
