import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AuthLayout } from "@/components/layouts/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api, setToken } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { googleSignIn, isGoogleConfigured } from "@/lib/google";
import { Phone, Mail, Eye, EyeOff, ArrowRight, MessageSquare, Lock } from "lucide-react";

// Country codes shown in picker
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
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors ${c.code === value ? "bg-slate-50 dark:bg-slate-900 font-bold text-primary" : ""}`}>
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

export function UserLogin() {
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
      sessionStorage.setItem("fixit_otp_role", "CONSUMER");
      navigate("/auth/user/otp");
    } catch (e: any) {
      toast({ title: "Couldn't send OTP", description: e.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const loginPhone = async () => {
    const num = phone.trim().replace(/\D/g, "");
    if (num.length < 7) { toast({ title: "Enter a valid phone number" }); return; }
    if (password.length < 6) { toast({ title: "Password is required", description: "Enter your password (6+ characters), or use OTP login below.", variant: "destructive" }); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ phone: countryCode + num, password });
    setBusy(false);
    if (error) { toast({ title: "Login failed", description: error.message, variant: "destructive" }); return; }
    if (data.session) {
      setToken(data.session.access_token);
      sessionStorage.removeItem("fixit_guest");
      const redirect = sessionStorage.getItem("fixit_post_auth");
      sessionStorage.removeItem("fixit_post_auth");
      navigate(redirect || "/home");
    }
  };

  const sendMagicLink = async () => {
    if (!email.trim()) { toast({ title: "Enter your email address" }); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/home' }
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
      sessionStorage.removeItem("fixit_guest");
      navigate("/home");
    }
  };

  const forgotPassword = async () => {
    if (!email.trim()) { toast({ title: "Enter your email first" }); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth/user/login?reset=1",
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
          redirectTo: window.location.origin + '/home'
        }
      });
      if (error) throw error;
    } catch (e: any) {
      toast({ title: "Google sign-in failed", description: e.message, variant: "destructive" });
      setBusy(false);
    }
  };

  const guest = () => {
    sessionStorage.setItem("fixit_guest", "true");
    setToken(null);
    navigate("/home");
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account">
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
                <label className="block text-sm font-semibold text-foreground">Password <span className="text-red-400">*</span></label>
                <button type="button" onClick={sendOtp} className="text-xs font-bold text-primary hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                  onKeyDown={(e) => e.key === "Enter" && loginPhone()}
                  className="h-14 rounded-xl bg-muted/60 border-border text-base pl-10 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <Button onClick={loginPhone} disabled={busy} className="w-full h-14 rounded-xl text-base font-bold gap-2">
              {busy ? "Loading…" : <><span>Sign in</span><ArrowRight className="w-5 h-5" /></>}
            </Button>
            <button type="button" onClick={sendOtp} disabled={busy}
              className="w-full text-center text-sm text-primary font-bold hover:underline flex items-center justify-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Sign in with SMS OTP instead
            </button>
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
          <Button variant="ghost" onClick={guest}
            className="w-full h-12 rounded-xl font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/40">
            Browse as guest
          </Button>
        </div>

        <div className="text-center pt-2 border-t border-border">
          <span className="text-sm text-muted-foreground">New to FixIt One? </span>
          <a href="/auth/user/register" className="text-primary font-bold hover:underline">Create account</a>
        </div>
        <div className="text-center -mt-2">
          <a href="/auth/vendor/login" className="text-xs text-muted-foreground hover:text-primary font-semibold">
            Are you a service provider? <span className="text-primary font-bold">Vendor login →</span>
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}

/** Where the vendor app lives (separate Vite app). */
const VENDOR_APP_URL =
  (import.meta as any).env?.VITE_VENDOR_APP_URL ??
  `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8084`;

export function UserOTP() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const phone = sessionStorage.getItem("fixit_otp_phone") || "";
  const otpRole = sessionStorage.getItem("fixit_otp_role") || "CONSUMER";
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [resendCd, setResendCd] = useState(60);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  // Countdown
  useEffect(() => {
    if (resendCd <= 0) return;
    const t = setTimeout(() => setResendCd((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCd]);

  // Redirect if no phone in session
  useEffect(() => {
    if (!phone) navigate("/auth/user/login");
  }, [phone]);

  const updateDigit = (i: number, val: string) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) refs[i + 1].current?.focus();
    if (next.every((x) => x !== "")) verify(next.join(""));
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits]; next[i] = ""; setDigits(next);
      } else if (i > 0) {
        refs[i - 1].current?.focus();
        const next = [...digits]; next[i - 1] = ""; setDigits(next);
      }
    }
  };

  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(""));
      refs[5].current?.focus();
      verify(pasted);
    }
  };

  const verify = async (code: string) => {
    if (code.length < 6 || busy) return;
    setBusy(true);
    try {
      const role = (sessionStorage.getItem("fixit_otp_role") as "CONSUMER" | "VENDOR") || "CONSUMER";
      const name = sessionStorage.getItem("fixit_otp_name") || undefined;
      const isLinking = sessionStorage.getItem("fixit_link_only") === "true";
      
      let tokenStr = "";
      if (isLinking) {
        // Just verify the phone number with Supabase
        const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
        if (error || !data.session) throw error || new Error("OTP verified but no session returned");
        tokenStr = data.session.access_token;
      } else {
        const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
        if (error || !data.session) throw error || new Error("Verification failed");
        tokenStr = data.session.access_token;
        // Optionally update full name if provided during registration
        if (name) {
          await supabase.auth.updateUser({ data: { full_name: name, role } });
        }
      }
      
      setToken(tokenStr);
      sessionStorage.removeItem("fixit_otp_role");
      sessionStorage.removeItem("fixit_otp_name");
      sessionStorage.removeItem("fixit_otp_phone");
      sessionStorage.removeItem("fixit_guest");
      sessionStorage.removeItem("fixit_link_only");

      // Referral attribution: if the user arrived via /invite/:code, record it.
      const refCode = localStorage.getItem("fixit_ref_code");
      if (refCode && role !== "VENDOR") {
        api.claimReferral(refCode).catch(() => {});
      }

      if (role === "VENDOR") {
        // The vendor dashboard is its own app — hand the session over.
        window.location.href = VENDOR_APP_URL;
        return;
      }
      const redirect = sessionStorage.getItem("fixit_post_auth");
      sessionStorage.removeItem("fixit_post_auth");
      navigate(redirect || "/home");
    } catch (e: any) {
      toast({ title: "Wrong code", description: e.message, variant: "destructive" });
      setDigits(["", "", "", "", "", ""]);
      refs[0].current?.focus();
      setBusy(false);
    }
  };

  const resend = async () => {
    if (resendCd > 0 || !phone) return;
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setDigits(["", "", "", "", "", ""]);
      setResendCd(60);
      refs[0].current?.focus();
      toast({ title: "New OTP sent", description: "Check your phone." });
    } catch (e: any) {
      toast({ title: "Couldn't resend", description: e.message, variant: "destructive" });
    }
  };

  const filled = digits.filter(Boolean).length;

  return (
    <AuthLayout title="Enter code" subtitle={`Sent to ${phone}`} backTo={otpRole === "VENDOR" ? "/auth/vendor/login" : "/auth/user/login"}>
      <div className="space-y-6">
        {/* Boxes */}
        <div className="flex justify-center gap-3" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              autoFocus={i === 0}
              onChange={(e) => updateDigit(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              className={`w-12 h-14 text-center text-2xl font-black rounded-xl border-2 outline-none transition-all bg-muted/40
                ${d ? "border-primary bg-slate-50 dark:bg-slate-900 text-primary shadow-[0_0_12px_rgba(27,110,243,0.2)]" : "border-border text-foreground"}
                focus:border-primary focus:ring-2 focus:ring-primary/30`}
            />
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5">
          {digits.map((d, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${d ? "bg-primary scale-110" : "bg-border"}`} />
          ))}
        </div>

        <Button onClick={() => verify(digits.join(""))} disabled={busy || filled < 6}
          className="w-full h-14 rounded-xl text-base font-bold gap-2">
          {busy ? "Verifying…" : <><span>Verify & Sign in</span><ArrowRight className="w-5 h-5" /></>}
        </Button>

        <div className="text-center">
          {resendCd > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend in <span className="font-bold text-foreground tabular-nums">{resendCd}s</span>
            </p>
          ) : (
            <button onClick={resend} className="text-sm text-primary font-bold hover:underline">
              Resend OTP
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <MessageSquare className="w-3 h-3" /> OTP delivered via SMS
        </p>
      </div>
    </AuthLayout>
  );
}
