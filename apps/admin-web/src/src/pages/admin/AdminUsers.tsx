import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShieldAlert, RefreshCw, Users } from "lucide-react";
import { api } from "@/lib/api";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Uses admin metrics endpoint which includes user summary, or fall back to empty
      const m = await api.adminMetrics();
      if (Array.isArray(m?.users)) setUsers(m.users);
      else {
        // Try fetching users directly if endpoint supports it
        setUsers([]);
      }
    } catch { setUsers([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.phone_number ?? "").includes(q) ||
      (u.user_id ?? "").includes(q);
  });

  const roleColor = (role: string) => {
    if (role === "VENDOR") return "bg-primary/10 text-primary border-primary/20";
    if (role === "ADMIN") return "bg-destructive/10 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Monitor platform participants and enforce rules.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name or phone…" className="pl-9 h-10 bg-card border-border" />
            </div>
            <Button variant="outline" size="icon" onClick={load} className="h-10 w-10 shrink-0"><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm p-4">Loading users…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{users.length === 0 ? "No user data returned from API yet." : "No users match your search."}</p>
            {users.length === 0 && <p className="text-xs mt-2 max-w-xs mx-auto">The /admin/metrics endpoint needs to return a <code>users</code> array. Add that to AdminService.getMetrics() to populate this table.</p>}
          </div>
        ) : (
          <Card className="bg-card border-border overflow-hidden">
            <div className="divide-y divide-border overflow-x-auto">
              <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-xs font-bold text-muted-foreground uppercase min-w-[700px]">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Plan</div>
                <div className="col-span-2 text-center">Strikes</div>
                <div className="col-span-2 text-center">Status</div>
              </div>
              {filtered.map((u: any) => (
                <div key={u.user_id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors min-w-[700px]">
                  <div className="col-span-4 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.full_name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{u.phone_number ?? String(u.user_id).slice(0, 12)}</p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className={`text-[10px] ${roleColor(u.role)}`}>{u.role}</Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-[10px] bg-card text-muted-foreground border-border">
                      {u.plan_id ?? "FREE"}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className={`flex items-center gap-1 text-sm font-bold ${(u.strikes ?? 0) >= 3 ? "text-destructive" : (u.strikes ?? 0) > 0 ? "text-warning" : "text-muted-foreground"}`}>
                      {(u.strikes ?? 0) > 0 && <ShieldAlert className="w-4 h-4" />}
                      {u.strikes ?? 0}/3
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Badge className={`text-[10px] shadow-none ${u.is_active !== false ? "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-950 dark:text-green-400" : "bg-destructive/20 text-destructive hover:bg-destructive/20"}`}>
                      {u.is_active !== false ? "Active" : "Suspended"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
