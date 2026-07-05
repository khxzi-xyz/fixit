import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useState } from "react";
import { Building2, User } from "lucide-react";

export default function VendorRegister() {
  const [type, setType] = useState<"individual" | "business">("individual");

  return (
    <AuthLayout title="Become a Provider" subtitle="Start earning with FixIt Now" backTo="/auth/vendor/login">
      <form className="space-y-6">

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setType("individual")}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${type === "individual" ? "border-primary bg-slate-100 dark:bg-slate-800 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <User className="w-6 h-6" />
            <span className="font-bold text-sm">Individual</span>
          </button>
          <button
            type="button"
            onClick={() => setType("business")}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${type === "business" ? "border-primary bg-slate-100 dark:bg-slate-800 text-primary" : "border-border bg-card text-muted-foreground hover:bg-muted"}`}
          >
            <Building2 className="w-6 h-6" />
            <span className="font-bold text-sm">Business</span>
          </button>
        </div>

        <div className="space-y-2">
          <Label>{type === "business" ? "Company Legal Name" : "Full Name"}</Label>
          <Input placeholder={type === "business" ? "Acme Fix LLC" : "John Doe"} className="h-12 bg-muted/50 border-border rounded-xl" required />
        </div>

        <div className="space-y-2">
          <Label>Primary Service Category</Label>
          <select className="w-full h-12 px-3 rounded-xl border border-border bg-muted/50 text-foreground focus:ring-2 focus:ring-primary outline-none">
            <option value="">Select...</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="ac">AC Repair</option>
          </select>
        </div>

        <Link href="/auth/vendor/kyc-id" className="block pt-4">
          <Button type="button" className="w-full h-14 rounded-xl text-lg font-bold shadow-[0_0_20px_rgba(27,110,243,0.3)]">
            Continue to KYC
          </Button>
        </Link>
      </form>
    </AuthLayout>
  );
}
