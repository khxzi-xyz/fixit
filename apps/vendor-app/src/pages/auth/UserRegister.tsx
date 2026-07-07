import { useState } from "react";
import { useLocation } from "wouter";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, setToken } from "@/lib/api";
import { googleSignIn, isGoogleConfigured } from "@/lib/google";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Phone, User, ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react";

const CODES = [
  { flag: "🇴🇲", code: "+968" }, { flag: "🇦🇪", code: "+971" }, { flag: "🇸🇦", code: "+966" },
  { flag: "🇶🇦", code: "+974" }, { flag: "🇰🇼", code: "+965" }, { flag: "🇵🇰", code: "+92" },
  { flag: "🇮🇳", code: "+91" }, { flag: "🇧🇩", code: "+880" },
];

function CodePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const sel = CODES.find((c) => c.code === value) ?? CODES[0];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className="h-14 px-3 bg-muted/60 border border-border rounded-full flex items-center gap-1.5 font-bold text-sm min-w-[88px] whitespace-nowrap outline-none focus:ring-2 focus:ring-primary">
        <span className="text-lg">{sel.flag}</span><span>{sel.code}</span>
      </button>
      {open && (
        <div className="absolute z-50 mt-2 w-44 bg-popover border border-border rounded-full shadow-xl overflow-hidden">
          {CODES.map((c) => (
            <button key={c.code} type="button" onClick={() => { onChange(c.code); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${c.code === value ? "bg-slate-50 dark:bg-slate-900 text-primary font-bold" : ""}`}>
              <span className="text-lg">{c.flag}</span><span className="font-mono">{c.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserRegister() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"form" | "confirm" | "link_phone">("form");
  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+968");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) { toast({ title: "Enter your full name" }); return; }
    const num = phone.replace(/\D/g, "");
    if (num.length < 7) { toast({ title: "Enter a valid phone number" }); return; }
    if (!password || password.length < 6) { toast({ title: "Password must be at least 6 characters" }); return; }
    setBusy(true);
    try {
      const full = countryCode + num;
      const res = await supabase.auth.signUp({ 
        phone: full, password,
        options: { data: { full_name: name.trim(), role: "CONSUMER" } }
      });
      const error = res.error;
      if (error) throw error;
      
      sessionStorage.setItem("fixit_otp_phone", full);
      sessionStorage.setItem("fixit_otp_name", name.trim());
      sessionStorage.setItem("fixit_otp_role", "CONSUMER");
      navigate("/auth/user/otp");
    } catch (e: any) {
      toast({ title: "Registration failed", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const submitEmail = async () => {
    if (!name.trim()) { toast({ title: "Enter your full name" }); return; }
    if (!email.trim() || password.length < 6) { toast({ title: "Enter email and a strong password (6+ chars)" }); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, role: "CONSUMER" } }
    });
    setBusy(false);
    if (error) { toast({ title: "Signup Failed", description: error.message, variant: "destructive" }); return; }
    if (data.session) {
      setToken(data.session.access_token);
      navigate("/home");
    } else {
      setStep("confirm");
    }
  };

  const withGoogle = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/home'
        }
      });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: "Google sign-in failed", description: e.message, variant: "destructive" });
      setBusy(false);
    }
  };

  if (step === "link_phone") {
    return (
      <AuthLayout title="Link Phone Number" subtitle="Please verify your phone number to continue." backTo="/auth/user/login">
        <form className="space-y-4" onSubmit={async (e) => {
          e.preventDefault();
          const num = phone.replace(/\D/g, "");
          if (num.length < 7) { toast({ title: "Enter a valid phone number" }); return; }
          setBusy(true);
          try {
            const full = countryCode + num;
            const { error } = await supabase.auth.signInWithOtp({ phone: full });
            if (error) throw error;
            sessionStorage.setItem("fixit_otp_phone", full);
            sessionStorage.setItem("fixit_otp_name", name.trim() || "Google User");
            sessionStorage.setItem("fixit_otp_role", "CONSUMER");
            sessionStorage.setItem("fixit_link_only", "true");
            navigate("/auth/user/otp");
          } catch (err: any) {
            toast({ title: "Couldn't send OTP", description: err.message, variant: "destructive" });
          } finally { setBusy(false); }
        }}>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Phone number</label>
            <div className="flex gap-2 w-full overflow-hidden">
              <CodePicker value={countryCode} onChange={setCountryCode} />
              <div className="flex-1 min-w-0">
                <Input type="tel" value={phone} inputMode="numeric"
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="9123 4567"
                  className="w-full h-14 bg-muted/60 border-border rounded-full px-4 text-lg font-semibold" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">We'll send a verification code to this number via SMS.</p>
          </div>
          <Button type="submit" disabled={busy} className="w-full h-14 rounded-full text-base font-bold gap-2 mt-2">
            {busy ? "Sending OTP…" : <><span>Send verification code</span><ArrowRight className="w-5 h-5" /></>}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  if (step === "confirm") {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent a confirmation link to your email address." backTo="/auth/user/login">
        <div className="text-center mt-6">
          <p className="text-muted-foreground mb-6">Please click the link in the email we sent to {email} to verify your account.</p>
          <Button onClick={() => navigate("/auth/user/login")} className="w-full h-14 text-base font-bold rounded-full">Back to Login</Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" subtitle="Join FixIt Now and find local pros" backTo="/auth/user/login">
      <div className="flex bg-muted/50 p-1 rounded-full mb-4">
        <button onClick={() => setAuthMode("phone")} className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${authMode === "phone" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Phone</button>
        <button onClick={() => setAuthMode("email")} className={`flex-1 py-2.5 text-sm font-bold rounded-full transition-all ${authMode === "email" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Email</button>
      </div>

      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); authMode === "phone" ? submit() : submitEmail(); }}>
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold text-foreground mb-1.5">Full name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmed Al-Rashidi"
              className="h-14 rounded-full bg-muted/60 border-border text-base pl-10" />
          </div>
        </div>

        {authMode === "phone" ? (
          <>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Phone number</label>
              <div className="flex gap-2 w-full overflow-hidden">
                <CodePicker value={countryCode} onChange={setCountryCode} />
                <div className="flex-1 min-w-0">
                  <Input type="tel" value={phone} inputMode="numeric"
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="9123 4567"
                    className="w-full h-14 bg-muted/60 border-border rounded-full px-4 text-lg font-semibold" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password (min 6 chars)"
                  className="h-14 rounded-full bg-muted/60 border-border text-base pl-10" required />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">Set a secure password for future logins.</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="h-14 rounded-full bg-muted/60 border-border text-base pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="h-14 rounded-full bg-muted/60 border-border text-base pl-10" />
              </div>
            </div>
          </>
        )}

        <Button type="submit" disabled={busy} className="w-full h-14 rounded-full text-base font-bold gap-2 mt-2">
          {busy ? "Loading…" : (authMode === "phone" ? <span>Create Account</span> : <span>Create Account</span>)}
        </Button>
      </form>

      {isGoogleConfigured() && (
        <>
          <div className="relative flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <Button variant="outline" onClick={withGoogle} disabled={busy}
            className="w-full h-12 rounded-full border-border font-semibold gap-2 hover:bg-muted/50">
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
            Sign up with Google
          </Button>
        </>
      )}

      <div className="text-center mt-5 pt-4 border-t border-border">
        <span className="text-sm text-muted-foreground">Already have an account? </span>
        <a href="/auth/user/login" className="text-primary font-bold hover:underline">Sign in</a>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-3 leading-relaxed">
        By continuing, you agree to our{" "}
        <a href="/tos" className="text-primary hover:underline">Terms of Service</a> and{" "}
        <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
      </p>
    </AuthLayout>
  );
}
