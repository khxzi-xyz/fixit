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
  "app.name": "FixIt Now",
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
  "nav.chats": "Chats", "nav.settings": "Settings", "nav.rewards": "Rewards",
  "common.getStarted": "Get Started",
  "common.loading": "Loading...", "common.error": "Something went wrong", "common.retry": "Retry",
  "common.save": "Save", "common.cancel": "Cancel", "common.delete": "Delete", "common.edit": "Edit",
  "common.back": "Back", "common.next": "Next", "common.done": "Done", "common.close": "Close",
  "common.noData": "No data available", "common.pullToRefresh": "Pull to refresh",
  "home.searchPlaceholder": "Search for a service…",
  "home.location": "Location", "home.recentJobs": "Recent Jobs", "home.viewAll": "View all",
  "home.activeJob": "Active Job", "home.topVendors": "Top Vendors", "home.services": "Services",
  "jobs.myJobs": "My Jobs", "jobs.all": "All", "jobs.active": "Active", "jobs.past": "Past",
  "jobs.drafts": "Drafts", "jobs.postNew": "Post a New Job", "jobs.noJobs": "No jobs yet",
  "jobs.viewBids": "View Bids", "jobs.track": "Track", "jobs.details": "Details", "jobs.repost": "Re-post",
  "wallet.myWallet": "My Wallet", "wallet.totalBalance": "Total Balance",
  "wallet.available": "Available", "wallet.escrow": "Escrow", "wallet.addFunds": "Add Funds",
  "wallet.transactions": "Transactions", "wallet.noTxns": "No transactions yet",
  "profile.myProfile": "My Profile", "profile.editProfile": "Edit Profile",
  "profile.viewPublic": "View Public", "profile.logout": "Log Out",
  "profile.completedJobs": "Completed", "profile.totalJobs": "Total",
  "rewards.myRewards": "My Rewards", "rewards.balance": "Available Balance",
  "rewards.lifetime": "Lifetime Earned", "rewards.redeem": "Redeem to Wallet",
  "rewards.history": "History", "rewards.invite": "Invite", "rewards.coupons": "Coupons",
  "rewards.applyCoupon": "Apply Coupon", "rewards.shareInvite": "Share Invite",
  "chats.title": "Chats", "chats.activeConversations": "Your active conversations",
  "chats.support": "FixIt Support", "chats.noChats": "No active chats",
  "settings.title": "Settings", "settings.language": "Language", "settings.theme": "Theme",
  "settings.notifications": "Notifications", "settings.security": "Security",
  "settings.trustedDevices": "Trusted Devices", "settings.exportData": "Export My Data",
  "auth.login": "Login", "auth.signup": "Sign Up", "auth.phone": "Phone Number",
  "auth.password": "Password", "auth.otp": "Enter OTP", "auth.biometric": "Login with Fingerprint",
};

const ar: Dict = {
  "app.tagline": "خدمة محلية فورية",
  "app.name": "فيكس إت ناو",
  "onboarding.welcome": "مرحباً بك في فيكس إت ناو",
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
  "nav.chats": "المحادثات", "nav.settings": "الإعدادات", "nav.rewards": "المكافآت",
  "common.getStarted": "ابدأ الآن",
  "common.loading": "جاري التحميل...", "common.error": "حدث خطأ", "common.retry": "إعادة المحاولة",
  "common.save": "حفظ", "common.cancel": "إلغاء", "common.delete": "حذف", "common.edit": "تعديل",
  "common.back": "رجوع", "common.next": "التالي", "common.done": "تم", "common.close": "إغلاق",
  "common.noData": "لا توجد بيانات", "common.pullToRefresh": "اسحب للتحديث",
  "home.searchPlaceholder": "ابحث عن خدمة...",
  "home.location": "الموقع", "home.recentJobs": "الأعمال الأخيرة", "home.viewAll": "عرض الكل",
  "home.activeJob": "عمل نشط", "home.topVendors": "أفضل الحرفيين", "home.services": "الخدمات",
  "jobs.myJobs": "أعمالي", "jobs.all": "الكل", "jobs.active": "نشط", "jobs.past": "سابق",
  "jobs.drafts": "مسودات", "jobs.postNew": "نشر عمل جديد", "jobs.noJobs": "لا توجد أعمال بعد",
  "jobs.viewBids": "عرض العروض", "jobs.track": "تتبع", "jobs.details": "التفاصيل", "jobs.repost": "إعادة النشر",
  "wallet.myWallet": "محفظتي", "wallet.totalBalance": "الرصيد الإجمالي",
  "wallet.available": "متاح", "wallet.escrow": "محجوز", "wallet.addFunds": "إضافة رصيد",
  "wallet.transactions": "المعاملات", "wallet.noTxns": "لا توجد معاملات بعد",
  "profile.myProfile": "ملفي الشخصي", "profile.editProfile": "تعديل الملف",
  "profile.viewPublic": "عرض عام", "profile.logout": "تسجيل الخروج",
  "rewards.myRewards": "مكافآتي", "rewards.balance": "الرصيد المتاح",
  "rewards.lifetime": "إجمالي المكتسب", "rewards.redeem": "صرف للمحفظة",
  "rewards.history": "السجل", "rewards.invite": "دعوة", "rewards.coupons": "كوبونات",
  "rewards.applyCoupon": "تطبيق الكوبون", "rewards.shareInvite": "مشاركة الدعوة",
  "chats.title": "المحادثات", "chats.activeConversations": "محادثاتك النشطة",
  "chats.support": "دعم فيكس إت", "chats.noChats": "لا توجد محادثات نشطة",
  "settings.title": "الإعدادات", "settings.language": "اللغة", "settings.theme": "المظهر",
  "settings.notifications": "الإشعارات", "settings.security": "الأمان",
  "auth.login": "تسجيل الدخول", "auth.signup": "إنشاء حساب", "auth.phone": "رقم الهاتف",
  "auth.password": "كلمة المرور", "auth.otp": "أدخل رمز التحقق", "auth.biometric": "تسجيل الدخول بالبصمة",
};

const ur: Dict = {
  "app.tagline": "مقامی خدمت",
  "app.name": "فکس اِٹ ناؤ",
  "onboarding.welcome": "فکس اِٹ ناؤ میں خوش آمدید",
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
  "nav.chats": "چیٹس", "nav.settings": "سیٹنگز", "nav.rewards": "انعامات",
  "common.getStarted": "شروع کریں",
  "common.loading": "لوڈ ہو رہا ہے...", "common.error": "کچھ غلط ہو گیا", "common.retry": "دوبارہ کوشش",
  "common.save": "محفوظ", "common.cancel": "منسوخ", "common.delete": "حذف", "common.edit": "ترمیم",
  "common.back": "واپس", "common.next": "اگلا", "common.done": "ہو گیا", "common.close": "بند",
  "common.noData": "کوئی ڈیٹا نہیں", "common.pullToRefresh": "ریفریش کے لیے نیچے کھینچیں",
  "home.searchPlaceholder": "خدمت تلاش کریں...",
  "home.location": "مقام", "home.recentJobs": "حالیہ کام", "home.viewAll": "سب دیکھیں",
  "home.activeJob": "فعال کام", "home.topVendors": "اعلیٰ کاریگر", "home.services": "خدمات",
  "jobs.myJobs": "میرے کام", "jobs.all": "سب", "jobs.active": "فعال", "jobs.past": "گزشتہ",
  "jobs.drafts": "مسودے", "jobs.postNew": "نیا کام پوسٹ کریں", "jobs.noJobs": "ابھی کوئی کام نہیں",
  "wallet.myWallet": "میرا والٹ", "wallet.totalBalance": "کل بیلنس",
  "wallet.available": "دستیاب", "wallet.escrow": "محفوظ", "wallet.addFunds": "رقم شامل کریں",
  "rewards.myRewards": "میرے انعامات", "rewards.balance": "دستیاب بیلنس",
  "rewards.redeem": "والٹ میں منتقل", "rewards.invite": "دعوت", "rewards.coupons": "کوپن",
  "chats.title": "چیٹس", "chats.support": "فکس اِٹ سپورٹ",
  "settings.title": "سیٹنگز", "settings.language": "زبان", "settings.theme": "تھیم",
  "auth.login": "لاگ ان", "auth.signup": "سائن اپ", "auth.phone": "فون نمبر",
  "auth.password": "پاسورڈ", "auth.biometric": "فنگر پرنٹ سے لاگ ان",
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
