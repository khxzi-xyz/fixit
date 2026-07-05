/**
 * Seeds subscription_plans with monthly / yearly / one-time (lifetime) variants
 * for consumers (Plus) and vendors (Pro, Elite). Idempotent upsert on plan_id.
 * Run: node scripts/seed-plans.mjs
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

// base monthly price → yearly = ~10 months, lifetime = ~33 months
const interval = (id, name, audience, monthly, take, priority, kind) => {
  const cfg = {
    MONTHLY: { fee: monthly, durationDays: 30, suffix: '', label: '/mo' },
    YEARLY: { fee: monthly * 10, durationDays: 365, suffix: '_YEARLY', label: '/yr' },
    ONCE: { fee: monthly * 33, durationDays: 36500, suffix: '_LIFETIME', label: ' once' },
  }[kind];
  return {
    plan_id: id + cfg.suffix,
    display_name: name,
    monthly_fee_omr: cfg.fee,
    take_rate_pct: take,
    priority_placement: priority,
    audience,
    is_active: true,
    perks: { interval: kind, durationDays: cfg.durationDays, priceLabel: cfg.label, base: id },
  };
};

const rows = [];
for (const k of ['MONTHLY', 'YEARLY', 'ONCE']) {
  rows.push(interval('PLUS', 'FixIt One Plus', 'CONSUMER', 3, 15, false, k));
  rows.push(interval('PRO', 'FixIt One Pro', 'VENDOR', 3, 18, true, k));
  rows.push(interval('ELITE', 'FixIt One Elite', 'VENDOR', 7, 12, true, k));
}

const res = await fetch(`${URL}/rest/v1/subscription_plans?on_conflict=plan_id`, {
  method: 'POST',
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify(rows),
});
console.log(`Seed ${rows.length} plans → HTTP ${res.status}`);
if (!res.ok) console.error(await res.text()); else console.log('✓ Plans seeded (monthly/yearly/lifetime).');
