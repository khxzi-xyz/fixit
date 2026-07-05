/**
 * useT -hook for real-time on-spot translation
 * Usage: const t = useT();  then:  t("Hello")  or  <T>Hello</T>
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { translate, getCurrentLang } from "./realtime-translate";

export function useT() {
  const langRef = useRef(getCurrentLang());
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Poll for language changes (localStorage)
    const id = setInterval(() => {
      const newLang = localStorage.getItem("fixit_lang") || "en";
      if (newLang !== langRef.current) {
        langRef.current = newLang;
        forceUpdate((v) => v + 1);
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  const t = useCallback(
    (text: string, fallback?: string): string => {
      const lang = localStorage.getItem("fixit_lang") || "en";
      if (lang === "en") return text;
      // Return cached immediately, trigger async update
      const cached = (() => {
        try {
          // Access cache via translate (returns promise) -we need sync access
          // We'll use a ref trick: call translate then schedule re-render
          translate(text).then((result) => {
            if (result !== text) forceUpdate((v) => v + 1);
          });
          return text; // return original while translating
        } catch {
          return fallback ?? text;
        }
      })();
      return cached;
    },
    [langRef.current]
  );

  return t;
}

/**
 * <T> component -wraps text and translates it in-place
 * Usage: <T>Post a Job</T>
 */
import React from "react";
import { translateSync, translate as translateAsync } from "./realtime-translate";

export function T({ children }: { children: string }) {
  const [text, setText] = useState(() => {
    const lang = localStorage.getItem("fixit_lang") || "en";
    if (lang === "en") return children;
    return translateSync(children); // instant if cached
  });

  useEffect(() => {
    const lang = localStorage.getItem("fixit_lang") || "en";
    if (lang === "en") { setText(children); return; }
    let cancelled = false;
    translateAsync(children).then((v) => { if (!cancelled) setText(v); });
    return () => { cancelled = true; };
  }, [children, localStorage.getItem("fixit_lang")]);

  return <>{text}</>;
}
