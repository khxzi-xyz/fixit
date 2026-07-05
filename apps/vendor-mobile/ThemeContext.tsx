/**
 * Theme provider -holds the active palette, lets any screen switch it at
 * runtime via useTheme(), and persists the choice per user (localStorage on
 * web + the backend user-settings endpoint so it follows the account).
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import { buildTheme, THEMES, type Theme, type ThemeKey } from "./theme";
import { api } from "./api";

const STORAGE_KEY = "FixIt Now_theme";

interface ThemeCtx {
  t: Theme;
  themeKey: ThemeKey;
  setTheme: (key: ThemeKey) => void;
  keys: ThemeKey[];
}

const Ctx = createContext<ThemeCtx | null>(null);

function readStored(): ThemeKey {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && THEMES[v]) return v as ThemeKey;
  }
  return "corporate";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setKey] = useState<ThemeKey>(readStored());

  const setTheme = (key: ThemeKey) => {
    setKey(key);
    if (Platform.OS === "web" && typeof localStorage !== "undefined") localStorage.setItem(STORAGE_KEY, key);
    // Best-effort sync to the account (ignored if unauthenticated).
    api.saveSettings({ theme: key }).catch(() => undefined);
  };

  // On login the app can call hydrateTheme(); also pull once on mount if authed.
  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        if (s?.theme && THEMES[s.theme] && s.theme !== themeKey) setKey(s.theme as ThemeKey);
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({ t: buildTheme(themeKey), themeKey, setTheme, keys: Object.keys(THEMES) as ThemeKey[] }),
    [themeKey],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(Ctx);
  return ctx ? ctx.t : buildTheme("light");
}

export function useThemeControls(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useThemeControls must be used within ThemeProvider");
  return ctx;
}
