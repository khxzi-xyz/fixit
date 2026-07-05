import { useState } from "react";
import { useLocation, Link } from "wouter";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export default function VendorLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState("+968");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    if (phone.length < 7) { toast({ title: "Enter a valid phone number" }); return; }
    setBusy(true);
    try {
      const fullPhone = countryCode + phone;
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
      if (error) throw error;
      sessionStorage.setItem("fixit_otp_phone", fullPhone);
      sessionStorage.setItem("fixit_otp_role", "VENDOR");
      toast({ title: "OTP sent", description: "Check your phone." });
      navigate("/auth/user/otp");
    } catch (e) { toast({ title: "Couldn't send code", description: e instanceof Error ? e.message : String(e) }); }
    finally { setBusy(false); }
  };

  const google = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/vendor/home'
        }
      });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: "Google sign-in failed", description: e.message, variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Vendor Login" subtitle="Access your FixIt Now provider dashboard" backTo="/auth/user/login">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Phone Number</Label>
          <div className="flex gap-2">
            <Input type="text" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-24 h-12 bg-muted/50 border-border rounded-xl text-center font-medium" />
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 15))} placeholder="9123 4567" inputMode="numeric" className="flex-1 h-12 bg-muted/50 border-border rounded-xl font-medium" />
          </div>
        </div>

        <Button onClick={sendOtp} disabled={busy} className="w-full h-14 rounded-xl text-lg font-bold">{busy ? "Sending…" : "Send OTP"}</Button>

        <div className="relative flex items-center py-1">
          <div className="flex-grow border-t border-border" /><span className="mx-3 text-xs text-muted-foreground uppercase">or</span><div className="flex-grow border-t border-border" />
        </div>

        <Button variant="outline" onClick={google} className="w-full h-12 rounded-xl border-border font-semibold gap-2">
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" /> Continue with Google
        </Button>

        <div className="text-center pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground">Don't have a vendor account?</p>
          <Link href="/auth/vendor/register" className="text-primary font-bold hover:underline mt-1 inline-block">Register as Provider</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
