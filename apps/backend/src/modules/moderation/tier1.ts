/**
 * Tier 1 deterministic disintermediation detector (PRD §2.B.2).
 * Sub-10ms, synchronous, runs before content is persisted/displayed.
 * Normalizes obfuscated formatting, then matches phone/email/messaging-app
 * patterns. A positive match short-circuits to PENDING_REVIEW.
 *
 * This deliberately detects *categories* (digit sequences, emails, app names),
 * not a brittle list of literal phrases (PRD §2.B.1).
 */
export interface Tier1Result {
  matched: boolean;
  reasons: string[];
  /** First offending span, for the admin split-view highlight. */
  span?: string;
}

const WORD_DIGITS: Record<string, string> = {
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  oh: '0',
};

// Common messaging apps + light spelling variants.
const APP_LEXICON = [
  'whatsapp', 'whats app', 'whatsap', 'watsapp', 'telegram', 'tele gram',
  'signal', 'viber', 'imo', 'snapchat', 'snap chat', 'instagram', 'insta',
];

const EMAIL_RE = /[a-z0-9._%+-]+\s*(@|\(at\)|\sat\s)\s*[a-z0-9.-]+\s*(\.|\(dot\)|\sdot\s)\s*[a-z]{2,}/i;

/** Collapse spacing/punctuation and convert spelled-out digits to numerals. */
function normalize(input: string): string {
  let s = input.toLowerCase();
  s = s.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|oh)\b/g, (m) => WORD_DIGITS[m]);
  return s;
}

/** Strip separators between digits so "9 8-7.6 5" => "98765". */
function digitsOnly(input: string): string {
  return input.replace(/[^0-9]/g, '');
}

export function tier1Scan(text: string): Tier1Result {
  const reasons: string[] = [];
  let span: string | undefined;

  const norm = normalize(text);

  // Phone: a run that, once separators are removed, yields >= 7 digits.
  const runRe = /(?:\+?\d[\d\s().\-]{5,}\d)/g;
  for (const m of norm.matchAll(runRe)) {
    if (digitsOnly(m[0]).length >= 7) {
      reasons.push('phone_like_digit_sequence');
      span ??= m[0].trim();
      break;
    }
  }

  const email = norm.match(EMAIL_RE);
  if (email) {
    reasons.push('email_like');
    span ??= email[0].trim();
  }

  for (const app of APP_LEXICON) {
    if (norm.includes(app)) {
      reasons.push(`messaging_app:${app.replace(/\s+/g, '')}`);
      span ??= app;
      break;
    }
  }

  return { matched: reasons.length > 0, reasons, span };
}
