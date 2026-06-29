import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard, ShieldAlert, Users, ListPlus, Activity } from "lucide-react";

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Engine</h1>
          <p className="text-muted-foreground">Platform overview & live metrics.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Payments</p>
                  <h3 className="text-3xl font-bold text-foreground">12</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border hover:border-destructive/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Open Disputes</p>
                  <h3 className="text-3xl font-bold text-destructive">3</h3>
                </div>
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <ShieldAlert className="w-6 h-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-warning/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Vendor Approvals</p>
                  <h3 className="text-3xl font-bold text-warning">8</h3>
                </div>
                <div className="p-3 bg-warning/10 rounded-xl">
                  <Users className="w-6 h-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-success/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Jobs</p>
                  <h3 className="text-3xl font-bold text-success">145</h3>
                </div>
                <div className="p-3 bg-success/10 rounded-xl">
                  <Activity className="w-6 h-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Feed */}
        <div>
          <h2 className="text-xl font-bold mb-4">Live Activity Feed</h2>
          <Card className="bg-card border-border">
            <div className="divide-y divide-border">
              {[
                { time: "2 mins ago", msg: "New vendor Ali's Plumbing registered.", type: "vendor" },
                { time: "5 mins ago", msg: "Job #101 escrow locked for 15 OMR.", type: "payment" },
                { time: "12 mins ago", msg: "Dispute raised on Job #89 (AC Repair).", type: "dispute" },
                { time: "28 mins ago", msg: "Consumer top-up 50 OMR via Bank Muscat.", type: "payment" },
                { time: "1 hr ago", msg: "Vendor Mohammed marked Job #76 Complete.", type: "job" },
              ].map((act, i) => (
                <div key={i} className="p-4 flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                    act.type === 'dispute' ? 'bg-destructive' : 
                    act.type === 'payment' ? 'bg-primary' : 
                    act.type === 'vendor' ? 'bg-warning' : 'bg-success'
                  }`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{act.msg}</p>
                    <p className="text-xs text-muted-foreground mt-1">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
