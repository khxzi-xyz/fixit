import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ConsumerLayout } from "@/components/layouts/ConsumerLayout";
import { ServiceIcon } from "@/components/ServiceIcon";
import { api } from "@/lib/api";

import { ChevronLeft, HelpCircle } from "lucide-react";

export default function ConsumerCategories() {
  const [, navigate] = useLocation();
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories()
      .then(setCats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ConsumerLayout>
      <div className="sticky top-0 z-40 bg-primary text-primary-foreground border-b border-border text-white px-4 pt-4 pb-5 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/home")}><ChevronLeft className="w-6 h-6" /></button>
          <div>
            <h1 className="text-xl font-extrabold">All Categories</h1>
            <p className="text-xs text-white/70">Browse every service on FixIt Now</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 pb-24">
        <p className="font-bold text-lg">Popular services</p>
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-full p-4 h-24 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full mb-3" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ))
          ) : cats.length > 0 ? (
            cats.map((cat) => {


              return (
                <Link key={cat.category_id} href={`/post-job?category=${cat.category_id}`}>
                  <div className="bg-card rounded-full border border-border shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow h-full cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <ServiceIcon id={cat.category_id} className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight">{cat.display_name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Tap to post a job</p>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-10">No categories found.</p>
          )}
        </div>

        <div className="pt-6 border-t border-border mt-4">
          <p className="font-bold text-lg mb-3">Can't find your service?</p>
          <Link href="/request-service">
            <div className="bg-slate-50 dark:bg-slate-900 border border-primary/20 rounded-full p-4 flex items-center gap-4 hover:bg-primary/10 transition-colors cursor-pointer group">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm text-primary group-hover:text-primary/80 transition-colors">Request Custom Service</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Tell us exactly what you need and we'll find a pro for you.</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </ConsumerLayout>
  );
}
