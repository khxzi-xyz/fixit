import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { api, setToken, setUserId } from "../api";
import { Card, GradientButton, GhostButton, useStyles } from "../ui";
import { useTheme } from "../ThemeContext";
import type { Theme } from "../theme";

interface FirebaseLoginProps {
  onSuccess: (token: string, name: string, uid: string) => void;
}

export function FirebaseLogin({ onSuccess }: FirebaseLoginProps) {
  const t = useTheme();
  const styles = useStyles(makeStyles);

  const [mode, setMode] = useState<"phone" | "email" | "google">("phone");
  const [busy, setBusy] = useState(false);

  // Phone Auth State
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);

  // Email Auth State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const syncVendorWithBackend = async (uid: string, fullName: string, userPhone?: string, userEmail?: string) => {
    try {
      // Sync with local backend
      const loginRes = await api.devLogin();
      setToken(loginRes.accessToken);
      setUserId(uid);
      
      // Write user node to Firestore
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        user_id: uid,
        full_name: fullName,
        phone_number: userPhone || "+96890000002",
        email: userEmail || "",
        role: "VENDOR",
        created_at: new Date().toISOString(),
      });

      console.log(`[FixIt Node Success]: Firebase authenticated vendor sync'd to Firestore node.`);
      onSuccess(loginRes.accessToken, fullName, uid);
    } catch (e) {
      console.error("[FixIt Node Failure]: Sync to live cluster failed", e);
    }
  };

  const handleEmailAuth = async () => {
    setBusy(true);
    try {
      let userCred;
      if (isSignUp) {
        userCred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      }
      const u = userCred.user;
      await syncVendorWithBackend(u.uid, name || u.email?.split("@")[0] || "Vendor Pro", undefined, u.email || undefined);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePhoneRequest = async () => {
    setBusy(true);
    try {
      const res = await api.requestOtp(phone);
      setOtpSent(true);
      setDevCode(res.devCode ?? "123456");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePhoneVerify = async () => {
    setBusy(true);
    try {
      const res = await api.verifyOtp(phone, code, name || undefined, "VENDOR");
      await syncVendorWithBackend(res.user.user_id, res.user.full_name, phone);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setBusy(true);
    try {
      const mockUid = `google_vendor_${Date.now()}`;
      await syncVendorWithBackend(mockUid, "Omani Vendor Pro", "+96890000002", "vendor@fixit.om");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.headerTitle}>Pro Portal Sign In</Text>
      
      {/* Tab Switcher */}
      <View style={styles.tabs}>
        {(["phone", "email", "google"] as const).map((m) => (
          <Pressable key={m} style={[styles.tab, mode === m && styles.tabActive]} onPress={() => setMode(m)}>
            <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>{m.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      {mode === "phone" && (
        <View style={styles.form}>
          <Text style={styles.label}>Omani Phone Number</Text>
          <TextInput style={styles.input} placeholder="+968 9XXX XXXX" placeholderTextColor={t.fgFaint} keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!otpSent} />
          {otpSent ? (
            <>
              {devCode && (
                <View style={styles.devCodeBox}>
                  <Text style={{ fontSize: 11, color: t.gold }}>Dev Code: {devCode}</Text>
                </View>
              )}
              <TextInput style={styles.input} placeholder="6-digit code" placeholderTextColor={t.fgFaint} keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
              <GradientButton label="Verify Code" onPress={handlePhoneVerify} busy={busy} />
            </>
          ) : (
            <GradientButton label="Request OTP Code" onPress={handlePhoneRequest} busy={busy} />
          )}
        </View>
      )}

      {mode === "email" && (
        <View style={styles.form}>
          {isSignUp && (
            <>
              <Text style={styles.label}>Full Name</Text>
              <TextInput style={styles.input} placeholder="Name" placeholderTextColor={t.fgFaint} value={name} onChangeText={setName} />
            </>
          )}
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} placeholder="vendor@fixit.om" placeholderTextColor={t.fgFaint} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={t.fgFaint} secureTextEntry value={password} onChangeText={setPassword} />
          <GradientButton label={isSignUp ? "Sign Up" : "Sign In"} onPress={handleEmailAuth} busy={busy} />
          <GhostButton label={isSignUp ? "Have an account? Sign In" : "Need an account? Sign Up"} onPress={() => setIsSignUp(!isSignUp)} />
        </View>
      )}

      {mode === "google" && (
        <View style={styles.form}>
          <Pressable style={styles.googleBtn} onPress={handleGoogleSignIn} disabled={busy}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.googleBtnText}>Continue with Google</Text>}
          </Pressable>
        </View>
      )}
    </Card>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  card: { padding: 16, backgroundColor: t.surface, borderRadius: 16, borderWeight: 1, borderColor: t.hairline },
  headerTitle: { fontSize: 16, fontWeight: "900", color: t.fg, marginBottom: 12, textAlign: "center" },
  tabs: { flexDirection: "row", gap: 6, marginBottom: 12 },
  tab: { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 6, background: t.bg },
  tabActive: { background: t.primary },
  tabText: { fontSize: 10, fontWeight: "800", color: t.fgMuted },
  tabTextActive: { color: t.primaryInk },
  form: { gap: 10 },
  label: { fontSize: 11, fontWeight: "800", color: t.fgMuted },
  input: { borderWeight: 1, borderColor: t.border, background: t.bg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: t.fg, fontSize: 13 },
  devCodeBox: { padding: 8, backgroundColor: "rgba(241,196,15,0.1)", borderRadius: 6, borderWeight: 1, borderColor: "rgba(241,196,15,0.2)" },
  googleBtn: { background: t.primary, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  googleBtnText: { color: t.primaryInk, fontWeight: "bold", fontSize: 13 },
});
