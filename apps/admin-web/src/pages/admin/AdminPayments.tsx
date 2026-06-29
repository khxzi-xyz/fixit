import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Image as ImageIcon, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const MOCK_PAYMENTS = [
  { id: "PAY-101", user: "Ahmed Al-Saadi", amount: 15, type: "Escrow Lock", date: "Oct 12, 10:30 AM" },
  { id: "PAY-102", user: "Fatima Al-Riyami", amount: 50, type: "Wallet Top-Up", date: "Oct 12, 11:15 AM" },
  { id: "PAY-103", user: "Tariq Mahmood", amount: 25, type: "Escrow Lock", date: "Oct 12, 12:00 PM" },
];

export default function AdminPayments() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Payment Verification</h1>
            <p className="text-muted-foreground">Verify bank transfer screenshots.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search payments..." className="pl-9 h-10 bg-card border-border" />
          </div>
        </div>

        <div className="space-y-4">
          {MOCK_PAYMENTS.map((payment) => (
            <Card key={payment.id} className="bg-card border-border">
              <CardContent className="p-0 flex flex-col md:flex-row">
                
                {/* Screenshot Preview */}
                <div className="md:w-48 h-48 md:h-auto bg-muted border-b md:border-b-0 md:border-r border-border flex flex-col items-center justify-center shrink-0">
                  <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground font-medium">View Receipt</span>
                </div>
                
                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase">{payment.id}</span>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">PENDING</Badge>
                      </div>
                      <h3 className="font-bold text-lg">{payment.user}</h3>
                      <p className="text-sm text-muted-foreground">{payment.type} • {payment.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{payment.amount} OMR</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 justify-end mt-4">
                    <Button variant="outline" className="h-10 px-6 border-destructive text-destructive hover:bg-destructive/10">
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button className="h-10 px-6 bg-success hover:bg-success/90 text-success-foreground">
                      <Check className="w-4 h-4 mr-2" /> Confirm Receipt
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
