import Slider from "@react-native-community/slider";
import { StyleSheet, Text, View } from "react-native";
import type { Theme } from "./theme";
import { useTheme } from "./ThemeContext";
import { useStyles } from "./ui";

/** Labeled value slider (Module 03/10 counter-bargain controls). */
export function LabeledSlider({
  label, value, min, max, step = 1, suffix, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; suffix?: string; onChange: (v: number) => void;
}) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <Text style={s.label}>{label}</Text>
        <Text style={s.value}>{value}{suffix ? ` ${suffix}` : ""}</Text>
      </View>
      <Slider
        style={{ width: "100%", height: 36 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={t.primary}
        maximumTrackTintColor={t.border}
        thumbTintColor={t.primary}
      />
      <View style={s.row}>
        <Text style={s.bound}>{min}{suffix ? ` ${suffix}` : ""}</Text>
        <Text style={s.bound}>{max}{suffix ? ` ${suffix}` : ""}</Text>
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  wrap: { gap: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: t.fgMuted, fontSize: 12.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3, fontFamily: t.font },
  value: { color: t.primary, fontSize: 18, fontWeight: "900", fontFamily: t.font },
  bound: { color: t.fgFaint, fontSize: 11, fontFamily: t.font },
});
