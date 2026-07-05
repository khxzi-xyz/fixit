/**
 * Zero-AI live translation for dynamic text. Backed by the DB
 * translation_dictionary (string_key + en/ar/ur). We build a reverse map
 * (English text → localized) and swap any text that has a dictionary entry;
 * unknown free text stays as written (no AI, no hallucination).
 */
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";

type Dict = Record<string, { en: string; ar: string; ur: string }>;
let dictCache: Dict | null = null;
let dictPromise: Promise<Dict> | null = null;

function loadDict(): Promise<Dict> {
  if (dictCache) return Promise.resolve(dictCache);
  if (!dictPromise) dictPromise = api.dictionary().then((d) => { dictCache = d || {}; return dictCache; }).catch(() => ({}));
  return dictPromise;
}

function localizedFor(text: string, lang: string, dict: Dict): string {
  if (lang === "en" || !text) return text;
  const norm = text.trim().toLowerCase();
  for (const v of Object.values(dict)) {
    if (v.en && v.en.trim().toLowerCase() === norm) {
      const t = lang === "ar" ? v.ar : lang === "ur" ? v.ur : v.en;
      return t || text;
    }
  }
  return text; // unknown free text → keep original (no AI)
}

export function useTranslated(texts: (string | undefined | null)[]): string[] {
  const { lang } = useI18n();
  const src = texts.map((t) => (t ?? "").toString());
  const [out, setOut] = useState<string[]>(src);
  const key = lang + "|" + src.join("");
  const lastKey = useRef("");

  useEffect(() => {
    if (key === lastKey.current) return;
    lastKey.current = key;
    if (lang === "en") { setOut(src); return; }
    let cancelled = false;
    loadDict().then((dict) => { if (!cancelled) setOut(src.map((s) => localizedFor(s, lang, dict))); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return out;
}
