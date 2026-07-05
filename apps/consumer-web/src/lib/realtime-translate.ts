/**
 * Real-time on-spot translation using Gemini API
 * No delay -instant replace, caching so same strings don't hit the API twice
 */

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";
const CACHE = new Map<string, string>();
let _lang = "en";

// Queue batching so we don't spam the API
const queue: Array<{ text: string; resolve: (v: string) => void }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function setTranslationLang(lang: string) {
  _lang = lang;
  CACHE.clear(); // clear cache when language changes
}

export function getCurrentLang() {
  return _lang;
}

async function flushQueue() {
  if (!queue.length || _lang === "en") {
    queue.forEach((q) => q.resolve(q.text));
    queue.length = 0;
    return;
  }

  const batch = queue.splice(0, 20); // max 20 at once
  const texts = batch.map((b) => b.text);

  try {
    const isBearer = GEMINI_KEY.startsWith("ya29.") || GEMINI_KEY.startsWith("AQ.");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (isBearer) {
      headers["Authorization"] = `Bearer ${GEMINI_KEY}`;
    } else {
      headers["x-goog-api-key"] = GEMINI_KEY;
    }

    const langNames: Record<string, string> = {
      ar: "Arabic",
      ur: "Urdu",
      hi: "Hindi",
      en: "English",
    };
    const targetLang = langNames[_lang] || "English";

    const prompt = `Translate the following UI text strings to ${targetLang}. 
Rules:
- Keep it natural and short (UI labels, not essays)
- Preserve any numbers, currency (OMR), emojis, and HTML tags exactly
- Return ONLY a JSON array of translated strings in the same order
- If a string is already in the target language or is a number/symbol, return it as-is

Strings to translate:
${JSON.stringify(texts)}

Return only the JSON array, nothing else.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "[]";

    // strip markdown code block if present
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
    const translated: string[] = JSON.parse(jsonStr);

    batch.forEach((b, i) => {
      const result = translated[i] ?? b.text;
      CACHE.set(b.text, result);
      b.resolve(result);
    });
  } catch {
    // fallback: return originals
    batch.forEach((b) => {
      CACHE.set(b.text, b.text);
      b.resolve(b.text);
    });
  }
}

/**
 * Translate a single string -returns cached result instantly if available
 */
export function translate(text: string): Promise<string> {
  if (!text || !text.trim() || _lang === "en") return Promise.resolve(text);

  const cached = CACHE.get(text);
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise<string>((resolve) => {
    queue.push({ text, resolve });
    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        flushTimer = null;
        flushQueue();
      }, 50); // 50ms debounce -batch collects within one render cycle
    }
  });
}

/**
 * Synchronous translation -returns cached value or original
 * Use for non-critical labels where async isn't needed
 */
export function translateSync(text: string): string {
  if (!text || _lang === "en") return text;
  return CACHE.get(text) ?? text;
}

/**
 * Pre-warm the cache with an array of common strings
 */
export async function prewarm(strings: string[]) {
  const uncached = strings.filter((s) => !CACHE.has(s));
  if (!uncached.length) return;
  await Promise.all(uncached.map((s) => translate(s)));
}
