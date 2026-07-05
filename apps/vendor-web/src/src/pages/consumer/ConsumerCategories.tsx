import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ChevronLeft, Wrench, Zap, Snowflake, Sparkles, Hammer, Shield, Paintbrush, Wind, HelpCircle } from "lucide-react";
import { SectionHeader } from "@/components/consumer/talabat-kit";
import { api } from "@/lib/api";

const ICONS: Record<string, any> = { AC: Snowflake, ELECTRICAL: Zap, PLUMBING: Wrench, SECURITY: Shield, HANDYMAN: Hammer, PAINTING: Paintbrush, CLEANING: Wind };
const TONES = ["bg-primary/10 text-primary", "bg-accent/10 text-accent", "bg-success/10 text-success", "bg-warning/10 text-warning"];

export default function ConsumerCategories() {
  const [cats, setCats] = useState<{ category_id: string; display_name: string }[]>([]);
  useEffect(() => { api.categories().then(setCats).catch(() => { }); }, []);

  return (
    <ConsumerLayout>
      <div className="sticky top-0 z-40 hero-blue text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/home"><ChevronLeft className="w-6 h-6" /></Link>
          <div>
            <h1 className="text-xl font-extrabold">All Categories</h1>
            <p className="text-xs text-white/70">Browse every service on FixIt Now</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        <SectionHeader title="Popular services" />
        <div className="grid grid-cols-2 gap-3">
          {cats.map((cat, i) => {
            const Icon = ICONS[cat.category_id] ?? Sparkles;
            return (
              <Link key={cat.category_id} href="/post-job">
                <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow h-full">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${TONES[i % TONES.length]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{cat.display_name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Tap to post a job</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {cats.length === 0 && <p className="text-sm text-muted-foreground">Loading categories…</p>}
        <div className="pt-6 border-t border-border mt-4">
          <SectionHeader title="Can't find your service?" />
          <Link href="/support">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 mt-2 flex flex-col items-center justify-center text-center gap-2 hover:bg-primary/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary"><HelpCircle className="w-6 h-6" /></div>
              <div>
                <p className="font-bold text-sm text-primary">Request a Custom Service</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Tell our admins what you need</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </ConsumerLayout>
  );
}
