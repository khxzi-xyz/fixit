import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CreditCard, Loader2 } from "lucide-react";

interface PaymentGatewayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  planName: string;
  onSuccess: () => void;
}

export function PaymentGatewayModal({ open, onOpenChange, amount, planName, onSuccess }: PaymentGatewayModalProps) {
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<"card" | "apple">("card");

  useEffect(() => {
    if (open) setProcessing(false);
  }, [open]);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onSuccess();
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={!processing ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="text-center mb-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-primary">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-black">Complete Payment</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Subscribe to {planName} for <span className="font-bold text-foreground">{amount.toFixed(3)} OMR</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className={`flex-1 h-12 rounded-xl border-2 transition-all ${method === "apple" ? "border-foreground bg-foreground/5" : "border-border"}`}
              onClick={() => setMethod("apple")}
              disabled={processing}
            >
              Apple Pay / GPay
            </Button>
            <Button
              variant="outline"
              className={`flex-1 h-12 rounded-xl border-2 transition-all ${method === "card" ? "border-primary bg-primary/5 text-primary" : "border-border"}`}
              onClick={() => setMethod("card")}
              disabled={processing}
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Card
            </Button>
          </div>

          {method === "card" && (
            <div className="space-y-3 bg-muted/50 p-4 rounded-2xl border border-border">
              <div>
                <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">Card Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="0000 0000 0000 0000"
                    disabled={processing}
                    className="w-full h-12 bg-background border border-border rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                    defaultValue="4242 4242 4242 4242"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">Expiry</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    disabled={processing}
                    className="w-full h-12 bg-background border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                    defaultValue="12/28"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground ml-1 mb-1 block">CVC</label>
                  <input
                    type="text"
                    placeholder="123"
                    disabled={processing}
                    className="w-full h-12 bg-background border border-border rounded-xl px-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                    defaultValue="123"
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handlePay}
            disabled={processing}
            className="w-full h-14 rounded-full text-lg font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 transition-all active:scale-[0.98]"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay ${amount.toFixed(3)} OMR`
            )}
          </Button>
          
          <p className="text-[10px] text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Payments are secure and encrypted
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
