import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, RefreshCw, List } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminCatalog() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cats = await api.categories();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch { setCategories([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = categories.filter((c) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (c.display_name ?? c.name ?? c.category_id ?? "").toLowerCase().includes(q);
  });

  const frameworkLabel = (fw: string) => {
    const map: Record<string, string> = {
      A: "A -Repair",
      B: "B -Transit",
      C: "C -Instant",
      D: "D -Subscription",
    };
    return map[fw] ?? fw ?? "Standard";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Catalog</h1>
            <p className="text-muted-foreground">
              {loading ? "Loading…" : `${categories.length} categories in DB`} -manage available service types.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={load} className="h-10 w-10"><RefreshCw className="w-4 h-4" /></Button>
            <Button className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              onClick={() => toast({ title: "Add via backend seed", description: "Run apps/backend/scripts/seed-catalog.mjs to add more categories." })}>
              <PlusCircle className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services…" className="pl-9 h-10 bg-card border-border" />
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm p-4">Loading categories…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <List className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{categories.length === 0 ? "No categories found. Run the seed script." : "No matches."}</p>
          </div>
        ) : (
          <Card className="bg-card border-border overflow-hidden">
            <div className="divide-y divide-border overflow-x-auto">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-xs font-bold text-muted-foreground uppercase min-w-[500px]">
                <div className="col-span-2">ID</div>
                <div className="col-span-5">Name</div>
                <div className="col-span-3">Framework</div>
                <div className="col-span-2 text-center">Icon</div>
              </div>
              {filtered.map((cat: any) => (
                <div key={cat.category_id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors min-w-[500px]">
                  <div className="col-span-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{String(cat.category_id).slice(0, 10)}</span>
                  </div>
                  <div className="col-span-5 font-semibold text-sm">{cat.display_name ?? cat.name}</div>
                  <div className="col-span-3">
                    <Badge variant="outline" className="text-[10px] bg-card text-muted-foreground border-border">
                      {frameworkLabel(cat.framework_type)}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-center text-lg">{cat.icon_key ?? "🔧"}</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
