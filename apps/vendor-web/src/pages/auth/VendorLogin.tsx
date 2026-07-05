import { useState } from "react";
import { useLocation, Link } from "wouter";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { isGoogleConfigured } from "@/lib/google";
import { Phone, Mail, Eye, EyeOff, ArrowRight, MessageSquare, Lock } from "lucide-react";
import { setToken } from "@/lib/api";

const CODES = [
  { flag: "🇴🇲", code: "+968", name: "Oman" },
  { flag: "🇦🇪", code: "+971", name: "UAE" },
  { flag: "🇸🇦", code: "+966", name: "KSA" },
  { flag: "🇶🇦", code: "+974", name: "Qatar" },
  { flag: "🇰🇼", code: "+965", name: "Kuwait" },
  { flag: "🇧🇭", code: "+973", name: "Bahrain" },
  { flag: "🇵🇰", code: "+92",  name: "Pakistan" },
  { flag: "🇮🇳", code: "+91",  name: "India" },
  { flag: "🇧🇩", code: "+880", name: "Bangladesh" },
  { flag: "🇬🇧", code: "+44",  name: "UK" },
  { flag: "🇺🇸", code: "+1",   name: "USA" },
];

function CountryPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = CODES.find((c) => c.code === value) ?? CODES[0];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="h-14 px-3 bg-muted/60 border border-border rounded-xl flex items-center gap-1.5 font-bold text-sm whitespace-nowrap focus:ring-2 focus:ring-primary outline-none min-w-[88px]">
        <span className="text-lg">{selected.flag}</span>
        <span>{selected.code}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-52 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
          {CODES.map((c) => (
            <button key={c.code} type="button" onClick={() => { onChange(c.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${c.code === value ? "bg-primary/5 font-bold text-primary" : ""}`}>
              <span className="text-lg">{c.flag}</span>
              <span className="flex-1 text-left">{c.name}</span>
              <span className="text-muted-foreground font-mono">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function VendorLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<"phone" | "email">("phone");
  const [countryCode, setCountryCode] = useState("+968");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const sendOtp = async () => {
    const num = phone.trim().replace(/\D/g, "");
    if (num.length < 7) { toast({ title: "Enter a valid phone number" }); return; }
    setBusy(true);
    try {
      const full = countryCode + num;
      const { error } = await supabase.auth.signInWithOtp({ phone: full });
      if (error) throw error;

      sessionStorage.setItem("fixit_otp_phone", full);
      sessionStorage.setItem("fixit_otp_role", "VENDOR");
      navigate("/auth/user/otp");
    } catch (e: any) {
      toast({ title: "Couldn't send OTP", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const loginPhone = async () => {
    if (!password) return sendOtp();
    const num = phone.trim().replace(/\D/g, "");
    if (num.length < 7) { toast({ title: "Enter a valid phone number" }); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ phone: countryCode + num, password });
    setBusy(false);
    if (error) { toast({ title: "Login failed", description: error.message, variant: "destructive" }); return; }
    if (data.session) {
      setToken(data.session.access_token);
      navigate("/vendor/home");
    }
  };

  const sendMagicLink = async () => {
    if (!email.trim()) { toast({ title: "Enter your email address" }); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/vendor/home' }
    });
    setBusy(false);
    if (error) { toast({ title: "Failed to send link", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Magic Link Sent", description: "Check your email for the login link." });
  };

  const loginEmail = async () => {
    if (!email.trim() || password.length < 6) {
      toast({ title: "Enter your email and password (6+ chars)" }); return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast({ title: "Login failed", description: error.message, variant: "destructive" }); return; }
    if (data.session) {
      setToken(data.session.access_token);
      navigate("/vendor/home");
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) { toast({ title: "Enter your email first" }); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/vendor/login?reset=1",
    });
    setBusy(false);
    if (error) {
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email sent", description: "Check your inbox for a password reset link." });
    }
  };

  const loginGoogle = async () => {
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
    <AuthLayout title="Provider Login" subtitle="Access your FixIt Now dashboard">
      <div className="space-y-5">
        {/* Tab */}
        <div className="flex bg-muted/50 p-1 rounded-xl">
          <button onClick={() => setTab("phone")} className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${tab === "phone" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
            <Phone className="w-4 h-4" /> Phone
          </button>
          <button onClick={() => setTab("email")} className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${tab === "email" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
            <Mail className="w-4 h-4" /> Email
          </button>
        </div>

        {tab === "phone" ? (
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">Phone number</label>
            <div className="flex gap-2">
              <CountryPicker value={countryCode} onChange={setCountryCode} />
              <input type="tel" value={phone} inputMode="numeric"
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
                onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                placeholder="9123 4567"
                className="flex-1 h-14 bg-muted/60 border border-border rounded-xl px-4 text-lg font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-foreground">Password (Optional)</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave empty to use OTP"
                  className="h-14 rounded-xl bg-muted/60 border-border text-base pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Leave password empty to login with SMS/WhatsApp OTP
            </p>
            <Button onClick={loginPhone} disabled={busy} className="w-full h-14 rounded-xl text-base font-bold gap-2">
              {busy ? "Loading…" : <><span>{password ? "Sign in" : "Send OTP"}</span><ArrowRight className="w-5 h-5" /></>}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="h-14 rounded-xl bg-muted/60 border-border text-base pl-10" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-foreground">Password</label>
                <button type="button" onClick={forgotPassword} className="text-xs font-bold text-primary hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="h-14 rounded-xl bg-muted/60 border-border text-base pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button type="button" onClick={loginEmail} disabled={busy} className="w-full h-14 rounded-xl text-base font-bold gap-2">
              {busy ? "Signing in…" : <><span>Sign in</span><ArrowRight className="w-5 h-5" /></>}
            </Button>
            <Button type="button" variant="outline" onClick={sendMagicLink} disabled={busy} className="w-full h-14 rounded-xl text-base font-bold">
              Send Magic Link
            </Button>
          </div>
        )}

        <div className="relative flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="space-y-2.5">
          {isGoogleConfigured() && (
            <Button variant="outline" onClick={loginGoogle} disabled={busy}
              className="w-full h-12 rounded-xl border-border font-semibold gap-2 hover:bg-muted/50">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
              Continue with Google
            </Button>
          )}
        </div>

        <div className="text-center pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">Don't have a provider account? </span>
          <Link href="/auth/vendor/register" className="text-primary font-bold hover:underline">Register</Link>
        </div>
      </div>
    </AuthLayout>
  );
}
