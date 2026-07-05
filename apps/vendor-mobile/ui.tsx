/**
 * Premium UI primitives -theme-aware. Each reads the active palette from
 * useTheme() and builds styles at render so switching themes re-skins instantly.
 */
import { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "./ThemeContext";
import type { Theme } from "./theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

/** Blue line icon. Defaults to the theme primary colour. */
export function Icon({ name, size = 18, color }: { name: IconName; size?: number; color?: string }) {
  const t = useTheme();
  return <Ionicons name={name} size={size} color={color ?? t.primary} />;
}

// --- Web font injection (Inter) + scrollbar --------------------------------
let fontsInjected = false;
export function ensureFonts() {
  if (Platform.OS !== "web" || fontsInjected || typeof document === "undefined") return;
  fontsInjected = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
  document.head.appendChild(link);
  const style = document.createElement("style");
  style.innerHTML = `
    *::-webkit-scrollbar { width: 9px; height: 9px; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: rgba(128,128,128,0.35); border-radius: 8px; }
    *::-webkit-scrollbar-thumb:hover { background: rgba(128,128,128,0.6); }
    input, textarea { outline: none; }
  `;
  document.head.appendChild(style);
}

// --- Fade / rise-in mount wrapper -------------------------------------------
export function Rise({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: ViewStyle }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, {
      toValue: 1,
      duration: 460,
      delay,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [v, delay]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

// --- Gradient primary button -------------------------------------------------
export function GradientButton({
  label, onPress, busy, disabled, icon, variant = "mint", style,
}: {
  label: string; onPress: () => void; busy?: boolean; disabled?: boolean; icon?: IconName;
  variant?: "mint" | "gold" | "violet"; style?: ViewStyle;
}) {
  const t = useTheme();
  const colors = variant === "gold" ? t.gradGold : variant === "violet" ? t.gradViolet : t.gradMint;
  const ink = variant === "violet" ? "#fff" : t.primaryInk;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        { borderRadius: t.radiusSm, overflow: "hidden" },
        (disabled || busy) && { opacity: 0.45 },
        pressed && { transform: [{ scale: 0.985 }] },
        Platform.OS === "web" ? ({ transition: "transform 120ms ease" } as any) : null,
        style,
      ]}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: "row", gap: 8, paddingVertical: 15, alignItems: "center", justifyContent: "center", borderRadius: t.radiusSm }}>
        {busy ? <ActivityIndicator color={ink} /> : (
          <>
            {icon && <Ionicons name={icon} size={18} color={ink} />}
            <Text style={{ fontWeight: "800", fontSize: 15.5, fontFamily: t.font, letterSpacing: 0.2, color: ink }}>{label}</Text>
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, style, danger, icon }: { label: string; onPress: () => void; style?: ViewStyle; danger?: boolean; icon?: IconName }) {
  const t = useTheme();
  const col = danger ? t.danger : t.fg;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { flexDirection: "row", gap: 8, borderWidth: 1, borderColor: danger ? t.danger : t.border, backgroundColor: danger ? t.dangerSoft : "transparent", borderRadius: t.radiusSm, paddingVertical: 13, alignItems: "center", justifyContent: "center" },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      {icon && <Ionicons name={icon} size={17} color={col} />}
      <Text style={{ color: col, fontWeight: "700", fontSize: 14.5, fontFamily: t.font }}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style, glow }: { children: ReactNode; style?: ViewStyle; glow?: boolean }) {
  const t = useTheme();
  return (
    <View
      style={[
        { backgroundColor: t.surfaceGlass, borderRadius: t.radius, borderWidth: 1, borderColor: t.hairline, padding: 18 },
        Platform.OS === "web" ? ({ backdropFilter: "blur(14px)" } as any) : null,
        glow && t.shadowGlow,
        t.shadowCard,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Pill({ label, tone = "muted" }: { label: string; tone?: "mint" | "gold" | "danger" | "info" | "muted" }) {
  const t = useTheme();
  const map = {
    mint: { bg: t.primarySoft, fg: t.primary },
    gold: { bg: t.goldSoft, fg: t.gold },
    danger: { bg: t.dangerSoft, fg: t.danger },
    info: { bg: "rgba(84,160,240,0.14)", fg: t.info },
    muted: { bg: t.surface2, fg: t.fgMuted },
  }[tone];
  return (
    <View style={{ backgroundColor: map.bg, paddingHorizontal: 11, paddingVertical: 5, borderRadius: t.radiusPill, alignSelf: "flex-start" }}>
      <Text style={{ color: map.fg, fontSize: 11, fontWeight: "800", letterSpacing: 0.4, textTransform: "uppercase", fontFamily: t.font }}>{label}</Text>
    </View>
  );
}

export function Skeleton({ h = 64, style }: { h?: number; style?: ViewStyle }) {
  const t = useTheme();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(v, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: Platform.OS !== "web" })).start();
  }, [v]);
  return (
    <View style={[{ height: h, backgroundColor: t.surface, borderRadius: t.radius, overflow: "hidden", borderWidth: 1, borderColor: t.hairline }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.surface2, opacity: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.25, 0.6, 0.25] }) }]} />
    </View>
  );
}

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body?: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: 44, gap: 10 }}>
      <View style={{ width: 72, height: 72, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: t.primarySoft, borderWidth: 1, borderColor: t.hairline, marginBottom: 4 }}>
        <Ionicons name={icon} size={32} color={t.primary} />
      </View>
      <Text style={{ color: t.fg, fontWeight: "800", fontSize: 17, fontFamily: t.font }}>{title}</Text>
      {!!body && <Text style={{ color: t.fgMuted, fontSize: 14, textAlign: "center", maxWidth: 300, lineHeight: 20, fontFamily: t.font }}>{body}</Text>}
    </View>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ color: t.fg, fontWeight: "800", fontSize: 18, fontFamily: t.font, letterSpacing: -0.2 }}>{children}</Text>
      {action}
    </View>
  );
}

// Helper for screens that still want a memoized StyleSheet from the theme.
export function useStyles<T>(factory: (t: Theme) => T): T {
  const t = useTheme();
  return useMemo(() => factory(t), [t, factory]);
}
