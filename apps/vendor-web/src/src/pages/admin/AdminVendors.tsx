import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Check, X, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function AdminVendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    try {
      const q = await api.kycQueue();
      setVendors(Array.isArray(q) ? q : []);
    } catch (e) {}
  };
  useEffect(() => { load(); }, []);

  const approve = async (docId: string, isApproved: boolean) => {
    setBusy(true);
    try {
      await api.kycReview(docId, isApproved);
      toast({ title: `Document ${isApproved ? "Approved" : "Rejected"}` });
      await load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message });
    } finally {
      setBusy(false);
    }
  };

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
          {vendors.map((vendor: any) => (
            <Card key={vendor.document_id} className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{String(vendor.vendor_id).slice(0, 8)}</span>
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">PENDING KYC</Badge>
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
                        {vendor.document_type}
                      </Badge>
                    </div>
                    <h3 className="text-xl font-bold mb-1">Vendor Document</h3>
                    <p className="text-xs text-muted-foreground mt-1">Submitted: {new Date(vendor.uploaded_at).toLocaleString()}</p>
                  </div>

                  {/* Documents */}
                  <div className="flex-1 flex gap-3">
                    <div className="flex-1 border border-border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 text-center relative overflow-hidden group" onClick={() => window.open(vendor.url, '_blank')}>
                      {vendor.url ? <img src={vendor.url} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-80 transition" /> : null}
                      <FileText className="w-6 h-6 text-muted-foreground mb-1 z-10 relative" />
                      <span className="text-xs font-medium z-10 relative">{vendor.document_type}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-2 justify-center">
                    <Button onClick={() => approve(vendor.document_id, true)} disabled={busy} className="w-full sm:w-auto h-10 px-6 bg-success hover:bg-success/90 text-success-foreground">
                      <Check className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button onClick={() => approve(vendor.document_id, false)} disabled={busy} variant="outline" className="w-full sm:w-auto h-10 px-6 border-destructive text-destructive hover:bg-destructive/10">
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
          {vendors.length === 0 && <p className="text-muted-foreground p-4">No pending KYC documents.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
