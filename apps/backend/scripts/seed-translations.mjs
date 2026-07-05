/**
 * Seeds translation_dictionary (zero-AI). Human-written en/ar/ur strings.
 * Run: node scripts/seed-translations.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }),
);
const URL = env.SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// string_key, en, ar, ur
const D = [
  ['nav.home', 'Home', 'الرئيسية', 'ہوم'],
  ['nav.search', 'Search', 'بحث', 'تلاش'],
  ['nav.post', 'Post', 'نشر', 'پوسٹ'],
  ['nav.wallet', 'Wallet', 'المحفظة', 'والٹ'],
  ['nav.profile', 'Profile', 'حسابي', 'پروفائل'],
  ['nav.dashboard', 'Dashboard', 'لوحة التحكم', 'ڈیش بورڈ'],
  ['nav.jobs', 'Jobs', 'الأعمال', 'کام'],
  ['nav.earnings', 'Earnings', 'الأرباح', 'آمدنی'],
  ['common.getStarted', 'Get Started', 'ابدأ الآن', 'شروع کریں'],
  ['common.postJob', 'Post a Job', 'انشر وظيفة', 'کام پوسٹ کریں'],
  ['common.topUp', 'Top Up', 'اشحن', 'ٹاپ اپ'],
  ['common.withdraw', 'Withdraw', 'سحب', 'نکالیں'],
  ['common.category', 'Service Category', 'فئة الخدمة', 'سروس کی قسم'],
  ['common.urgency', 'Urgency', 'الإلحاح', 'فوری حیثیت'],
  ['common.description', 'Description', 'الوصف', 'تفصیل'],
  ['common.photos', 'Photos', 'الصور', 'تصاویر'],
  ['common.placeBid', 'Place Bid', 'قدّم عرضاً', 'بولی لگائیں'],
  ['common.reviews', 'Reviews', 'التقييمات', 'جائزے'],
  ['common.settings', 'Settings', 'الإعدادات', 'ترتیبات'],
  ['common.notifications', 'Notifications', 'الإشعارات', 'اطلاعات'],
  ['common.addresses', 'Saved addresses', 'العناوين المحفوظة', 'محفوظ پتے'],
  ['app.tagline', 'Hyper-local Khidmah', 'خدمة محلية فورية', 'مقامی خدمت'],
];

const rows = D.map(([string_key, text_en, text_ar, text_ur]) => ({ string_key, text_en, text_ar, text_ur }));
const res = await fetch(`${URL}/rest/v1/translation_dictionary?on_conflict=string_key`, {
  method: 'POST',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify(rows),
});
console.log(`Seed ${rows.length} translations → HTTP ${res.status}`);
if (!res.ok) console.error(await res.text()); else console.log('✓ Dictionary seeded (en/ar/ur).');
