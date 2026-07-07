import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Building2, User, CheckCircle2 } from "lucide-react";
import { api, tokenClaims } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function VendorRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [type, setType] = useState<"individual" | "business">("individual");
  const [name, setName] = useState("");
  const [cats, setCats] = useState<{ category_id: string; display_name: string }[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!tokenClaims()) {
      setLocation("/auth/vendor/login");
      return;
    }
    // Fetch categories
    api.categories().then(setCats).catch(() => {});
  }, [setLocation]);

  const toggleCat = (id: string) => {
    setSelectedCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Please enter your name" }); return; }
    if (selectedCats.length === 0) { toast({ title: "Please select at least one service" }); return; }

    setBusy(true);
    try {
      // Create/Update the vendor profile
      await api.upsertVendorProfile({
        categoryIds: selectedCats,
        radiusMeters: type === "business" ? 50000 : 15000 // default ranges
      });
      setLocation("/auth/vendor/kyc-id");
    } catch (err: any) {
      toast({ title: "Failed to create profile", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Become a Provider" subtitle="Start earning with FixIt Now" backTo="/auth/vendor/login">
      <form onSubmit={submit} className="space-y-6">

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setType("individual")}
            className={`p-4 rounded-full border-2 flex flex-col items-center gap-2 transition-colors ${type === "individual" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <User className="w-6 h-6" />
            <span className="font-bold text-sm">Individual</span>
          </button>
          <button
            type="button"
            onClick={() => setType("business")}
            className={`p-4 rounded-full border-2 flex flex-col items-center gap-2 transition-colors ${type === "business" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <Building2 className="w-6 h-6" />
            <span className="font-bold text-sm">Business</span>
          </button>
        </div>

        <div className="space-y-2">
          <Label>{type === "business" ? "Company Legal Name" : "Full Name"}</Label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder={type === "business" ? "Acme Fix LLC" : "John Doe"} className="h-12 bg-muted/50 border-border rounded-full" required />
        </div>

        <div className="space-y-2">
          <Label>Service Categories (Select multiple)</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {cats.length === 0 ? <p className="text-sm text-muted-foreground">Loading services...</p> : null}
            {cats.map(cat => (
              <button
                key={cat.category_id}
                type="button"
                onClick={() => toggleCat(cat.category_id)}
                className={`p-3 text-left border rounded-full flex items-center justify-between text-sm transition-colors ${selectedCats.includes(cat.category_id) ? "border-primary bg-primary/10 text-primary font-bold" : "border-border bg-card text-foreground"}`}
              >
                <span>{cat.display_name}</span>
                {selectedCats.includes(cat.category_id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button disabled={busy} type="submit" className="w-full h-14 rounded-full text-lg font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">
            {busy ? "Creating Profile..." : "Continue to KYC"}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
