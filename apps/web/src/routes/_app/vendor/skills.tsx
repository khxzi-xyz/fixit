import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useApp } from "@/context/AppContext";
import { BadgeCheck, Hourglass, Plus, Upload } from "lucide-react";

export const Route = createFileRoute("/_app/vendor/skills")({
  head: () => ({ meta: [{ title: "Skill Tags — FixIt Vendor" }] }),
  component: Skills,
});

function Skills() {
  const { skills, addSkill } = useApp();
  const [name, setName] = useState("");
  return (
    <div>
      <PageHeader eyebrow="Module 02 · Multi-skill tagging" title="Your approved trades" subtitle="Per-skill approval. Job visibility is filtered to skills you've actually been cleared for." />

      <div className="grid gap-3 md:grid-cols-2">
        {skills.map((s) => (
          <div key={s.name} className="flex items-center justify-between rounded-2xl border border-border bg-white p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              {s.status === "approved"
                ? <BadgeCheck className="h-6 w-6 text-emerald-600" />
                : <Hourglass className="h-6 w-6 text-amber-600" />}
              <div>
                <div className="text-sm font-black text-[var(--navy)]">{s.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{s.status}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-[var(--shadow-soft)]">
        <div className="text-sm font-bold text-[var(--navy)]">Add a skill</div>
        <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Carpentry"
            className="rounded-lg border border-input bg-[var(--offwhite)] px-3 py-2 text-sm outline-none focus:border-[var(--azure)]" />
          <button className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-[var(--navy)]"><Upload className="h-3.5 w-3.5" /> Upload proof</button>
          <button
            onClick={() => { if (name) { addSkill(name); setName(""); } }}
            className="rounded-lg bg-[var(--azure)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--navy)]"
          ><Plus className="inline h-4 w-4" /> Submit</button>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Admin reviews per-skill. You can be approved for one trade and pending for another simultaneously.</p>
      </div>
    </div>
  );
}