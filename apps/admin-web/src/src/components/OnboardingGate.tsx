/**
 * First-open gate (Talabat-style): pick country (flags) + language, then a
 * mandatory Terms of Service + Privacy Policy acceptance that CANNOT be bypassed.
 * Renders as a full-screen overlay until accepted; children render underneath.
 */
import { useState } from "react";
import { Check, ChevronRight, ShieldCheck } from "lucide-react";
import { useI18n, LANGUAGES, COUNTRIES, flagUrl, type Lang } from "@/lib/i18n";

const LEGAL_KEY = "FixIt Now_legal_accepted_v1";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { t, lang, setLang, country, setCountry, dir } = useI18n();
  const [accepted, setAccepted] = useState<boolean>(() => localStorage.getItem(LEGAL_KEY) === "1");
  const [step, setStep] = useState<"locale" | "legal">(() => (localStorage.getItem("FixIt Now_lang") ? "legal" : "locale"));
  const [checked, setChecked] = useState(false);

  if (accepted) return <>{children}</>;

  const accept = () => {
    if (!checked) return;
    localStorage.setItem(LEGAL_KEY, "1");
    setAccepted(true);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col" dir={dir}>
      {/* Brand bar */}
      <div className="hero-blue text-white px-6 pt-10 pb-8 rounded-b-3xl text-center shadow-md">
        <img src={import.meta.env.BASE_URL + "logo.png"} className="w-16 h-16 mx-auto mb-3 drop-shadow" alt="FixIt Now" />
        <h1 className="text-2xl font-black">FixIt Now</h1>
        <p className="text-white/80 text-sm">{t("app.tagline")}</p>
      </div>

      {step === "locale" ? (
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-7">
          <div>
            <h2 className="text-lg font-extrabold mb-3">{t("onboarding.chooseCountry")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {COUNTRIES.map((c) => (
                <button key={c.code} onClick={() => setCountry(c.code)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-start transition-colors ${country === c.code ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <img src={flagUrl(c.code)} alt="" className="w-9 h-6 rounded object-cover shadow-sm" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.dial}</p>
                  </div>
                  {country === c.code && <Check className="w-4 h-4 text-primary ms-auto shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-extrabold mb-3">{t("onboarding.chooseLanguage")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => setLang(l.code as Lang)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${lang === l.code ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                  <div className="text-start">
                    <p className="font-bold text-base">{l.native}</p>
                    <p className="text-[11px] text-muted-foreground">{l.label}</p>
                  </div>
                  {lang === l.code && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-extrabold">{t("legal.title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground">{t("legal.intro")}</p>

          <div className="bg-card border border-border rounded-2xl p-4 max-h-[34vh] overflow-y-auto text-sm leading-relaxed space-y-3">
            <h3 className="font-bold">{t("legal.tosHeading")}</h3>
            <p className="text-muted-foreground">FixIt Now connects consumers with independent, verified service professionals ("Pros") in your region. FixIt Now is a marketplace and escrow facilitator; Pros are not employees of FixIt Now. By creating an account you agree to provide accurate information, fund jobs through the in-app wallet/escrow, and resolve disputes through the in-app process. Service fees, bid tokens, warranty terms and payouts are shown in-app before you commit. Fraud, abuse, or attempts to transact off-platform may result in suspension and forfeiture of held funds per the dispute policy.</p>
            <h3 className="font-bold pt-2">{t("legal.privacyHeading")}</h3>
            <p className="text-muted-foreground">We collect your phone number, name, approximate location, job details, and media you upload (e.g. before/after proof photos) to operate the service, match you with Pros, process escrow, and prevent fraud. Location and verification photos may include timestamp and GPS metadata used solely for job verification. We do not sell your personal data. Data is stored securely and retained as required for legal, tax, and dispute-resolution purposes. You may request deletion of your account subject to those obligations.</p>
          </div>

          <button onClick={() => setChecked((v) => !v)} className="flex items-start gap-3 w-full text-start">
            <span className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-primary border-primary" : "border-border"}`}>
              {checked && <Check className="w-4 h-4 text-white" />}
            </span>
            <span className="text-sm font-medium">{t("legal.agree")}</span>
          </button>
        </div>
      )}

      {/* Sticky action */}
      <div className="px-5 py-4 border-t border-border bg-background safe-area-bottom">
        {step === "locale" ? (
          <button onClick={() => setStep("legal")} className="w-full h-13 py-4 rounded-xl hero-blue text-white font-bold flex items-center justify-center gap-2">
            {t("onboarding.continue")} <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        ) : (
          <>
            <button onClick={accept} disabled={!checked}
              className={`w-full py-4 rounded-xl font-bold transition-opacity ${checked ? "hero-blue text-white" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
              {t("legal.accept")}
            </button>
            {!checked && <p className="text-center text-[11px] text-muted-foreground mt-2">{t("legal.mustAccept")}</p>}
          </>
        )}
      </div>
    </div>
  );
}
