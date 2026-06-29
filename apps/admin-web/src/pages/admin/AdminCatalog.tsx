import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Search, Settings2 } from "lucide-react";

const MOCK_SERVICES = [
  { id: 1, name: "Plumbing", framework: "A (Repair)", active: true },
  { id: 2, name: "Electrical", framework: "A (Repair)", active: true },
  { id: 3, name: "Furniture Moving", framework: "B (Transit)", active: true },
  { id: 4, name: "Snow Removal", framework: "C (Instant)", active: false },
];

export default function AdminCatalog() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Catalog</h1>
            <p className="text-muted-foreground">Manage available categories and frameworks.</p>
          </div>
          <Button className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Category
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search services..." className="pl-9 h-10 bg-card border-border" />
          </div>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <div className="divide-y divide-border">
            <div className="grid grid-cols-12 gap-4 p-4 bg-muted/50 text-sm font-bold text-muted-foreground">
              <div className="col-span-5">Service Name</div>
              <div className="col-span-4">Framework</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-1 text-right">Edit</div>
            </div>
            
            {MOCK_SERVICES.map((service) => (
              <div key={service.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/30 transition-colors">
                <div className="col-span-5 font-semibold">{service.name}</div>
                <div className="col-span-4">
                  <Badge variant="outline" className="bg-card text-muted-foreground border-border">{service.framework}</Badge>
                </div>
                <div className="col-span-2 flex justify-center">
                  <Switch checked={service.active} />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Settings2 className="w-4 h-4" />
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
