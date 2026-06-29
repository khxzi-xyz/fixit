import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, Receipt, Banknote, Briefcase } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/analytics")({
  head: () => ({ meta: [{ title: "Analytics — FixIt Vendor" }] }),
  component: Analytics,
});

function Analytics() {
  const [data, setData] = useState<{ series: { month: string; total: number }[]; gross: number; fees: number; payouts: number; jobs: number } | null>(null);
  useEffect(() => { api.vendorAnalytics().then(setData).catch(() => setData({ series: [], gross: 0, fees: 0, payouts: 0, jobs: 0 })); }, []);

  const stats = [
    { label: "Gross earnings", value: data ? `${data.gross.toFixed(3)} OMR` : "—", icon: TrendingUp, color: "text-emerald-600" },
    { label: "Platform fees", value: data ? `${data.fees.toFixed(3)} OMR` : "—", icon: Receipt, color: "text-[var(--azure)]" },
    { label: "Withdrawn", value: data ? `${data.payouts.toFixed(3)} OMR` : "—", icon: Banknote, color: "text-amber-600" },
    { label: "Earning months", value: data ? String(data.jobs) : "—", icon: Briefcase, color: "text-[var(--navy)]" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Zone 6 · Revenue ledger" title="Performance analytics" subtitle="Live earnings derived from your wallet ledger — no mock numbers." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
              <Icon className={`h-5 w-5 ${s.color}`} />
              <div className="mt-2 text-lg font-black text-[var(--navy)]">{s.value}</div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="mb-3 text-sm font-bold text-[var(--navy)]">Earnings by month</div>
        {data && data.series.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="total" fill="#134074" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="grid h-48 place-items-center text-sm text-muted-foreground">Complete jobs to see your earnings chart.</div>
        )}
      </div>
    </div>
  );
}
