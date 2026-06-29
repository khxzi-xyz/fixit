import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Check, X, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";

const MOCK_VENDORS = [
  { id: "V-201", name: "Ali's Plumbing LLC", type: "Business", category: "Plumbing", submitted: "2 hours ago" },
  { id: "V-202", name: "Mohammed Al-Rashidi", type: "Individual", category: "Electrical", submitted: "5 hours ago" },
];

export default function AdminVendors() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vendor Approvals</h1>
            <p className="text-muted-foreground">Review KYC documents and approve skills.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search vendors..." className="pl-9 h-10 bg-card border-border" />
          </div>
        </div>

        <div className="grid gap-4">
          {MOCK_VENDORS.map((vendor) => (
            <Card key={vendor.id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{vendor.id}</span>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">PENDING KYC</Badge>
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        {vendor.type === 'Business' ? <Building2 className="w-3 h-3 mr-1" /> : null}
                        {vendor.type}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{vendor.name}</h3>
                    <p className="text-sm text-muted-foreground">Primary Skill: <strong className="text-foreground">{vendor.category}</strong></p>
                    <p className="text-xs text-muted-foreground mt-1">Submitted {vendor.submitted}</p>
                  </div>

                  {/* Documents */}
                  <div className="flex-1 flex gap-3">
                    <div className="flex-1 border border-border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 text-center">
                      <FileText className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs font-medium">Resident ID</span>
                    </div>
                    {vendor.type === "Business" && (
                      <div className="flex-1 border border-border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 text-center">
                        <FileText className="w-6 h-6 text-muted-foreground mb-1" />
                        <span className="text-xs font-medium">Trade License</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-2 justify-center">
                    <Button className="w-full sm:w-auto h-10 px-6 bg-success hover:bg-success/90 text-success-foreground">
                      <Check className="w-4 h-4 mr-2" /> Approve All
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto h-10 px-6 border-destructive text-destructive hover:bg-destructive/10">
                      <X className="w-4 h-4 mr-2" /> Reject Application
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
