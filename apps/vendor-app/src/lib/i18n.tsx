/**
 * Lightweight i18n for FixIt Now (no external dep). Stores language in localStorage,
 * flips <html dir> for RTL (Arabic/Urdu), and falls back to English for any
 * untranslated key so partial dictionaries still render cleanly.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type Lang = "en" | "ar" | "ur" | "hi" | "bn";
export const RTL_LANGS: Lang[] = ["ar", "ur"];

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "ar", label: "Arabic", native: "العربية" },
  { code: "ur", label: "Urdu", native: "اردو" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "bn", label: "Bangla", native: "বাংলা" },
];

export const COUNTRIES: { code: string; name: string; dial: string }[] = [
  { code: "om", name: "Oman", dial: "+968" },
  { code: "ae", name: "United Arab Emirates", dial: "+971" },
  { code: "sa", name: "Saudi Arabia", dial: "+966" },
  { code: "qa", name: "Qatar", dial: "+974" },
  { code: "bh", name: "Bahrain", dial: "+973" },
  { code: "kw", name: "Kuwait", dial: "+965" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "app.tagline": "Hyper-local Khidmah",
  "onboarding.welcome": "Welcome to FixIt Now",
  "onboarding.chooseCountry": "Choose your country",
  "onboarding.chooseLanguage": "Choose your language",
  "onboarding.continue": "Continue",
  "legal.title": "Before you start",
  "legal.intro": "Please review and accept our Terms of Service and Privacy Policy to use FixIt Now.",
  "legal.tosHeading": "Terms of Service",
  "legal.privacyHeading": "Privacy Policy",
  "legal.agree": "I have read and accept the Terms of Service & Privacy Policy",
  "legal.accept": "Accept & Continue",
  "legal.mustAccept": "You must accept to continue",
  "nav.home": "Home", "nav.search": "Search", "nav.post": "Post", "nav.wallet": "Wallet",
  "nav.profile": "Profile", "nav.dashboard": "Dashboard", "nav.jobs": "Jobs", "nav.earnings": "Earnings",
  "common.getStarted": "Get Started",
};

const ar: Dict = {
  "app.tagline": "خدمة محلية فورية",
  "onboarding.welcome": "مرحباً بك في فيكس إت",
  "onboarding.chooseCountry": "اختر بلدك",
  "onboarding.chooseLanguage": "اختر لغتك",
  "onboarding.continue": "متابعة",
  "legal.title": "قبل أن تبدأ",
  "legal.intro": "يرجى مراجعة وقبول شروط الخدمة وسياسة الخصوصية لاستخدام فيكس إت.",
  "legal.tosHeading": "شروط الخدمة",
  "legal.privacyHeading": "سياسة الخصوصية",
  "legal.agree": "لقد قرأت وأوافق على شروط الخدمة وسياسة الخصوصية",
  "legal.accept": "أوافق وأتابع",
  "legal.mustAccept": "يجب الموافقة للمتابعة",
  "nav.home": "الرئيسية", "nav.search": "بحث", "nav.post": "نشر", "nav.wallet": "المحفظة",
  "nav.profile": "حسابي", "nav.dashboard": "لوحة التحكم", "nav.jobs": "الأعمال", "nav.earnings": "الأرباح",
  "common.getStarted": "ابدأ الآن",
};

const ur: Dict = {
  "app.tagline": "مقامی خدمت",
  "onboarding.welcome": "فکس اِٹ میں خوش آمدید",
  "onboarding.chooseCountry": "اپنا ملک منتخب کریں",
  "onboarding.chooseLanguage": "اپنی زبان منتخب کریں",
  "onboarding.continue": "جاری رکھیں",
  "legal.title": "شروع کرنے سے پہلے",
  "legal.intro": "فکس اِٹ استعمال کرنے کے لیے ہماری سروس کی شرائط اور پرائیویسی پالیسی کو قبول کریں۔",
  "legal.tosHeading": "سروس کی شرائط",
  "legal.privacyHeading": "پرائیویسی پالیسی",
  "legal.agree": "میں نے سروس کی شرائط اور پرائیویسی پالیسی پڑھ لی ہے اور قبول کرتا ہوں",
  "legal.accept": "قبول کریں اور جاری رکھیں",
  "legal.mustAccept": "جاری رکھنے کے لیے قبول کرنا ضروری ہے",
  "nav.home": "ہوم", "nav.search": "تلاش", "nav.post": "پوسٹ", "nav.wallet": "والٹ",
  "nav.profile": "پروفائل", "nav.dashboard": "ڈیش بورڈ", "nav.jobs": "کام", "nav.earnings": "آمدنی",
  "common.getStarted": "شروع کریں",
};

const hi: Dict = {
  "app.tagline": "स्थानीय सेवा",
  "onboarding.welcome": "फिक्सइट में आपका स्वागत है",
  "onboarding.chooseCountry": "अपना देश चुनें",
  "onboarding.chooseLanguage": "अपनी भाषा चुनें",
  "onboarding.continue": "जारी रखें",
  "legal.title": "शुरू करने से पहले",
  "legal.intro": "फिक्सइट का उपयोग करने के लिए कृपया हमारी सेवा की शर्तें और गोपनीयता नीति स्वीकार करें।",
  "legal.tosHeading": "सेवा की शर्तें",
  "legal.privacyHeading": "गोपनीयता नीति",
  "legal.agree": "मैंने सेवा की शर्तें और गोपनीयता नीति पढ़ ली है और स्वीकार करता हूँ",
  "legal.accept": "स्वीकार करें और जारी रखें",
  "legal.mustAccept": "जारी रखने के लिए स्वीकार करना आवश्यक है",
  "nav.home": "होम", "nav.search": "खोज", "nav.post": "पोस्ट", "nav.wallet": "वॉलेट",
  "nav.profile": "प्रोफ़ाइल", "nav.dashboard": "डैशबोर्ड", "nav.jobs": "काम", "nav.earnings": "कमाई",
  "common.getStarted": "शुरू करें",
};

const bn: Dict = {
  "app.tagline": "স্থানীয় সেবা",
  "onboarding.welcome": "ফিক্সইট-এ স্বাগতম",
  "onboarding.chooseCountry": "আপনার দেশ নির্বাচন করুন",
  "onboarding.chooseLanguage": "আপনার ভাষা নির্বাচন করুন",
  "onboarding.continue": "চালিয়ে যান",
  "legal.title": "শুরু করার আগে",
  "legal.intro": "ফিক্সইট ব্যবহার করতে অনুগ্রহ করে আমাদের সেবার শর্তাবলী ও গোপনীয়তা নীতি গ্রহণ করুন।",
  "legal.tosHeading": "সেবার শর্তাবলী",
  "legal.privacyHeading": "গোপনীয়তা নীতি",
  "legal.agree": "আমি সেবার শর্তাবলী ও গোপনীয়তা নীতি পড়েছি এবং গ্রহণ করছি",
  "legal.accept": "গ্রহণ করুন ও চালিয়ে যান",
  "legal.mustAccept": "চালিয়ে যেতে গ্রহণ করতে হবে",
  "nav.home": "হোম", "nav.search": "অনুসন্ধান", "nav.post": "পোস্ট", "nav.wallet": "ওয়ালেট",
  "nav.profile": "প্রোফাইল", "nav.dashboard": "ড্যাশবোর্ড", "nav.jobs": "কাজ", "nav.earnings": "আয়",
  "common.getStarted": "শুরু করুন",
};

const DICTS: Record<Lang, Dict> = { en, ar, ur, hi, bn };

const LANG_KEY = "FixIt Now_lang";
const COUNTRY_KEY = "FixIt Now_country";

interface I18nCtx {
  lang: Lang;
  country: string;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  setCountry: (c: string) => void;
  t: (key: string, fallback?: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem(LANG_KEY) as Lang) || "en");
  const [country, setCountryState] = useState<string>(() => localStorage.getItem(COUNTRY_KEY) || "om");
  const dir: "ltr" | "rtl" = RTL_LANGS.includes(lang) ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => { localStorage.setItem(LANG_KEY, l); setLangState(l); }, []);
  const setCountry = useCallback((c: string) => { localStorage.setItem(COUNTRY_KEY, c); setCountryState(c); }, []);

  const t = useCallback((key: string, fallback?: string) => {
    return DICTS[lang]?.[key] ?? DICTS.en[key] ?? fallback ?? key;
  }, [lang]);

  const value = useMemo(() => ({ lang, country, dir, setLang, setCountry, t }), [lang, country, dir, setLang, setCountry, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}

export const flagUrl = (code: string, w = 80) => `https://flagcdn.com/w${w}/${code}.png`;
