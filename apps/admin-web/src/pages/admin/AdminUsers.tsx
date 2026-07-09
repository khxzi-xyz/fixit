import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ShieldAlert, RefreshCw, Users, Edit } from "lucide-react";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone_number: "", role: "", password: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const u = await api.adminUsers();
      setUsers(Array.isArray(u) ? u : []);
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

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setBusy(true);
    try {
      const updates: any = {
        full_name: editForm.full_name,
        phone_number: editForm.phone_number,
        role: editForm.role
      };
      if (editForm.password.trim()) {
        if (editForm.password.length < 6) throw new Error("Password must be at least 6 characters");
        updates.password = editForm.password;
      }
      await api.req('POST', `/admin/users/${editingUser.user_id}/update`, updates);
      toast({ title: "User updated successfully" });
      setEditingUser(null);
      load();
    } catch (e: any) {
      toast({ title: "Failed to update", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
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
                <div className="col-span-3">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Plan</div>
                <div className="col-span-2 text-center">Strikes</div>
                <div className="col-span-2 text-center">Status</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>
              {filtered.map((u: any) => (
                <div key={u.user_id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors min-w-[700px]">
                  <div className="col-span-3 min-w-0">
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
                  <div className="col-span-1 flex justify-center">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                      setEditingUser(u);
                      setEditForm({ full_name: u.full_name || "", phone_number: u.phone_number || "", role: u.role || "CONSUMER", password: "" });
                    }}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Full Name</label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))} className="bg-muted/50 border-border" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Phone Number</label>
              <Input value={editForm.phone_number} onChange={(e) => setEditForm(prev => ({ ...prev, phone_number: e.target.value }))} className="bg-muted/50 border-border" />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Role</label>
              <select value={editForm.role} onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))} className="w-full h-10 px-3 bg-muted/50 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="CONSUMER">CONSUMER</option>
                <option value="VENDOR">VENDOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div className="pt-2 border-t border-border mt-2">
              <label className="text-sm font-semibold mb-1 block text-destructive">Change Password</label>
              <p className="text-xs text-muted-foreground mb-2">Leave blank if you don't want to change it.</p>
              <Input type="password" placeholder="New Password" value={editForm.password} onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))} className="bg-muted/50 border-border" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleUpdateUser} disabled={busy}>{busy ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
