/**
 * FixIt design system — multi-theme. A light (default) palette plus dark and
 * accent variants. Shared tokens (spacing, radii, type, gradients) stay
 * constant; only colors swap. Consumed via useTheme() so the whole app
 * re-themes at runtime and the choice is saved per user.
 */
export interface Palette {
  name: string;
  mode: "light" | "dark";
  bg: string;
  bgElev: string;
  surface: string;
  surface2: string;
  surfaceGlass: string;
  border: string;
  borderSoft: string;
  hairline: string;
  fg: string;
  fgMuted: string;
  fgFaint: string;
  primary: string;
  primarySoft: string;
  primaryInk: string;
  primaryDeep: string;
  accent: string;
  accentSoft: string;
  gold: string;
  goldSoft: string;
  warn: string;
  danger: string;
  dangerSoft: string;
  info: string;
  gradMint: readonly [string, string];
  gradNight: readonly [string, string];
  gradHero: readonly [string, string, string];
  gradGold: readonly [string, string];
  gradViolet: readonly [string, string];
}

const tokens = {
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  radius: 18,
  radiusSm: 12,
  radiusLg: 26,
  radiusPill: 999,
  font: "Inter, -apple-system, system-ui, sans-serif",
  fontTight: "Inter, -apple-system, system-ui, sans-serif",
  shadowCard: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  shadowGlow: { shadowColor: "#10A875", shadowOpacity: 0.35, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
};

// --- Light (default) — clean white, emerald accent --------------------------
const light: Palette = {
  name: "Light",
  mode: "light",
  bg: "#F6F8F7",
  bgElev: "#FFFFFF",
  surface: "#FFFFFF",
  surface2: "#EEF2F0",
  surfaceGlass: "rgba(255,255,255,0.78)",
  border: "#E2E8E5",
  borderSoft: "rgba(0,0,0,0.05)",
  hairline: "rgba(0,0,0,0.07)",
  fg: "#0C1A14",
  fgMuted: "#5B6B63",
  fgFaint: "#94A39B",
  primary: "#10A875",
  primarySoft: "rgba(16,168,117,0.12)",
  primaryInk: "#FFFFFF",
  primaryDeep: "#0B8A5E",
  accent: "#6C5CE7",
  accentSoft: "rgba(108,92,231,0.12)",
  gold: "#C98A12",
  goldSoft: "rgba(201,138,18,0.13)",
  warn: "#D98A1E",
  danger: "#E0445C",
  dangerSoft: "rgba(224,68,92,0.10)",
  info: "#2C9CD6",
  gradMint: ["#16C088", "#0B9A66"],
  gradNight: ["#FFFFFF", "#F6F8F7"],
  gradHero: ["#FFFFFF", "#F1F6F3", "#F6F8F7"],
  gradGold: ["#E7B24E", "#CD8E2C"],
  gradViolet: ["#8B7BFF", "#5E4BD6"],
};

// --- Dark — emerald night ----------------------------------------------------
const dark: Palette = {
  name: "Dark",
  mode: "dark",
  bg: "#05100C",
  bgElev: "#0A1A14",
  surface: "#0E2019",
  surface2: "#13291F",
  surfaceGlass: "rgba(20,41,31,0.62)",
  border: "#1C3A2E",
  borderSoft: "rgba(255,255,255,0.06)",
  hairline: "rgba(255,255,255,0.08)",
  fg: "#F4FBF7",
  fgMuted: "#8FA89C",
  fgFaint: "#5E7468",
  primary: "#22E29A",
  primarySoft: "rgba(34,226,154,0.14)",
  primaryInk: "#03130D",
  primaryDeep: "#10A875",
  accent: "#8B7BFF",
  accentSoft: "rgba(139,123,255,0.14)",
  gold: "#F5C065",
  goldSoft: "rgba(245,192,101,0.14)",
  warn: "#F5B14E",
  danger: "#FF6B7A",
  dangerSoft: "rgba(255,107,122,0.13)",
  info: "#54C7F0",
  gradMint: ["#22E29A", "#10A875"],
  gradNight: ["#0A1A14", "#05100C"],
  gradHero: ["#123026", "#0A1A14", "#05100C"],
  gradGold: ["#F5C065", "#E89B3C"],
  gradViolet: ["#8B7BFF", "#5E4BD6"],
};

// --- Midnight — deep indigo --------------------------------------------------
const midnight: Palette = {
  ...dark,
  name: "Midnight",
  bg: "#080B1A",
  bgElev: "#0D1228",
  surface: "#121838",
  surface2: "#1A2147",
  surfaceGlass: "rgba(18,24,56,0.62)",
  border: "#232C58",
  fg: "#EEF1FF",
  fgMuted: "#9AA3CC",
  fgFaint: "#646C99",
  primary: "#6C8BFF",
  primarySoft: "rgba(108,139,255,0.16)",
  primaryInk: "#060916",
  primaryDeep: "#4B68E0",
  accent: "#C77DFF",
  gradMint: ["#6C8BFF", "#4B68E0"],
  gradHero: ["#1A2147", "#0D1228", "#080B1A"],
};

// --- Sunset — warm amber -----------------------------------------------------
const sunset: Palette = {
  ...dark,
  name: "Sunset",
  bg: "#160E0B",
  bgElev: "#211410",
  surface: "#2A1A14",
  surface2: "#34211A",
  surfaceGlass: "rgba(42,26,20,0.62)",
  border: "#43291F",
  fg: "#FFF3EC",
  fgMuted: "#C9A795",
  fgFaint: "#8A6B5C",
  primary: "#FF8A4C",
  primarySoft: "rgba(255,138,76,0.15)",
  primaryInk: "#1A0E08",
  primaryDeep: "#E0683C",
  accent: "#FFC15E",
  gradMint: ["#FF8A4C", "#E0683C"],
  gradHero: ["#34211A", "#211410", "#160E0B"],
};

// --- Corporate (default) — blue & white, Talabat/OLX-grade -------------------
const corporate: Palette = {
  name: "Blue",
  mode: "light",
  bg: "#EEF4F8",
  bgElev: "#FFFFFF",
  surface: "#FFFFFF",
  surface2: "#E3ECF4",
  surfaceGlass: "rgba(255,255,255,0.82)",
  border: "#D4E0EC",
  borderSoft: "rgba(11,37,69,0.05)",
  hairline: "rgba(11,37,69,0.08)",
  fg: "#0B2545",
  fgMuted: "#5A7184",
  fgFaint: "#9DB2C6",
  primary: "#134074",
  primarySoft: "rgba(19,64,116,0.10)",
  primaryInk: "#FFFFFF",
  primaryDeep: "#0B2545",
  accent: "#2E6FC0",
  accentSoft: "rgba(46,111,192,0.12)",
  gold: "#C98A12",
  goldSoft: "rgba(201,138,18,0.13)",
  warn: "#E0922A",
  danger: "#E0445C",
  dangerSoft: "rgba(224,68,92,0.10)",
  info: "#2E6FC0",
  gradMint: ["#1E5B9E", "#134074"],
  gradNight: ["#FFFFFF", "#EEF4F8"],
  gradHero: ["#8DA9C4", "#EEF4F8", "#FFFFFF"],
  gradGold: ["#E7B24E", "#CD8E2C"],
  gradViolet: ["#2E6FC0", "#134074"],
};

export const THEMES: Record<string, Palette> = { corporate, light, dark, midnight, sunset };
export const THEME_KEYS = ["corporate", "light", "dark", "midnight", "sunset"] as const;
export type ThemeKey = (typeof THEME_KEYS)[number];

// Static default export (used at module load before the provider mounts, and by
// any not-yet-converted module). The live, switchable value comes from useTheme().
export const theme = { ...corporate, ...tokens };
export type Theme = typeof theme;

export function buildTheme(key: string): Theme {
  return { ...(THEMES[key] ?? corporate), ...tokens };
}
