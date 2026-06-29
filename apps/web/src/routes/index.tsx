import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LOGO_URL, useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FixIt — Secure Home Services in Oman" },
      { name: "description", content: "Reverse-auction marketplace with escrow protection. Find trusted vendors across Oman." },
      { property: "og:title", content: "FixIt — Oman's Trusted Marketplace" },
      { property: "og:description", content: "Post a job. Receive blind bids. Pay safely via escrow." },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  const { login, requestOtp, verifyOtp } = useApp();
  const [mode, setMode] = useState<"consumer" | "vendor">("consumer");
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const dest = (r: "consumer" | "vendor") => (r === "vendor" ? "/vendor/opportunities" : "/consumer/dashboard");

  const onSend = async () => {
    setBusy(true); setErr(null);
    try { const r = await requestOtp(phone); setDevCode(r.devCode ?? null); setSent(true); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const onVerify = async () => {
    setBusy(true); setErr(null);
    try { await verifyOtp(phone, code, mode); navigate({ to: dest(mode) }); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  const onDemo = async () => {
    setBusy(true); setErr(null);
    try { await login(mode); navigate({ to: dest(mode) }); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: "var(--gradient-navy)" }}>
      <div className="absolute inset-0 opacity-30 pointer-events-none"
           style={{ background: "radial-gradient(600px circle at 50% 30%, rgba(141,169,196,0.45), transparent 60%)" }} />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="mb-6 rounded-3xl bg-white/95 p-6 shadow-2xl ring-4 ring-white/20">
          <img src={LOGO_URL} alt="FixIt logo" className="h-40 w-40 sm:h-48 sm:w-48" />
        </div>
        <h1 className="text-5xl font-black tracking-tight text-white">FixIt</h1>
        <p className="mt-2 text-center text-sm text-white/75">
          Oman's escrow-secured marketplace for home services & repairs.
        </p>

        <div className="mt-8 w-full rounded-2xl bg-white p-2 shadow-2xl">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--offwhite)] p-1">
            {(["consumer", "vendor"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  mode === m ? "bg-[var(--navy)] text-white shadow" : "text-[var(--navy)]/70"
                }`}
              >
                {m === "consumer" ? "Find a Service Provider" : "Offer My Services"}
              </button>
            ))}
          </div>

          <div className="p-4">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Phone number
            </label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex h-11 items-center rounded-lg border border-input bg-[var(--offwhite)] px-3 text-sm font-semibold text-[var(--navy)]">
                🇴🇲 +968
              </div>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="9XXX XXXX"
                inputMode="numeric"
                className="h-11 text-base"
                disabled={sent}
              />
            </div>

            {sent && (
              <div className="mt-3">
                {devCode && (
                  <div className="mb-2 rounded-lg bg-[var(--amber-warn)]/15 px-3 py-2 text-center text-sm font-semibold text-[var(--navy)]">
                    Dev code: <span className="tracking-[0.3em]">{devCode}</span>
                  </div>
                )}
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="6-digit code"
                  inputMode="numeric"
                  className="h-11 text-center text-lg tracking-[0.4em]"
                />
              </div>
            )}

            {err && <p className="mt-2 text-xs font-medium text-[var(--alert-red)]">{err}</p>}

            {!sent ? (
              <Button onClick={onSend} disabled={busy || phone.length < 8} className="mt-4 h-12 w-full bg-[var(--azure)] text-base font-semibold text-white hover:bg-[var(--navy)]">
                {busy ? "Sending…" : "Send verification code"}
              </Button>
            ) : (
              <Button onClick={onVerify} disabled={busy || code.length !== 6} className="mt-4 h-12 w-full bg-[var(--azure)] text-base font-semibold text-white hover:bg-[var(--navy)]">
                {busy ? "Verifying…" : "Verify & continue"}
              </Button>
            )}

            <button onClick={onDemo} disabled={busy} className="mt-3 w-full text-center text-xs font-medium text-muted-foreground hover:text-[var(--azure)]">
              Skip → Enter demo workspace ({mode})
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-white/50">
          By continuing you agree to FixIt's Oman service terms & escrow policy.
        </p>
      </div>
    </div>
  );
}
