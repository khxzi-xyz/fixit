import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Ban, ShieldAlert, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";

const MOCK_USERS = [
  { id: "U-882", name: "Mohammed Al-Rashidi", role: "Consumer", tier: "FREE", strikes: 0, status: "Active" },
  { id: "U-883", name: "Ali's Plumbing LLC", role: "Vendor", tier: "PRO", strikes: 1, status: "Active" },
  { id: "U-884", name: "Tariq Mahmood", role: "Vendor", tier: "FREE", strikes: 3, status: "Suspended" },
];

export default function AdminUsers() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground">Monitor platform participants and enforce rules.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search phone or name..." className="pl-9 h-10 bg-card border-border" />
          </div>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <div className="divide-y divide-border overflow-x-auto">
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-sm font-bold text-muted-foreground min-w-[800px]">
              <div className="col-span-3">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Tier</div>
              <div className="col-span-2 text-center">Strikes</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>
            
            {MOCK_USERS.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors min-w-[800px]">
                <div className="col-span-3">
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.id}</p>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className={user.role === 'Vendor' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted text-muted-foreground border-border'}>
                    {user.role}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className={user.tier === 'PRO' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-transparent text-muted-foreground border-border'}>
                    {user.tier}
                  </Badge>
                </div>
                <div className="col-span-2 flex justify-center">
                  <div className={`flex items-center gap-1 font-bold ${user.strikes >= 3 ? 'text-destructive' : user.strikes > 0 ? 'text-warning' : 'text-success'}`}>
                    {user.strikes > 0 && <ShieldAlert className="w-4 h-4" />}
                    {user.strikes}/3
                  </div>
                </div>
                <div className="col-span-2 flex justify-center">
                  <Badge className={user.status === 'Active' ? 'bg-success/20 text-success hover:bg-success/20 shadow-none' : 'bg-destructive/20 text-destructive hover:bg-destructive/20 shadow-none'}>
                    {user.status}
                  </Badge>
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
