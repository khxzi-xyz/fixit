import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, Image, Modal, Platform, Pressable, SafeAreaView, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, View,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import {
  api, FeedJob, getToken, MyJob, PartsFundingRequest, PayoutSchedule,
  setToken, setUserId, VendorProfile, WarrantyTerms,
} from "./api";
import { FirebaseLogin } from "./components/FirebaseLogin";
import { EarningsScreen, AvailabilityScreen, SkillsScreen, ServicesScreen, SettingsScreen } from "./screens";
import { joinUser } from "./realtime";
import type { Theme } from "./theme";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { ensureFonts, useStyles, Pill, GradientButton, GhostButton, Card } from "./ui";
import { Ionicons } from "@expo/vector-icons";
import { LabeledSlider } from "./Slider";

const URGENCY_LABEL: Record<string, string> = { EMERGENCY: "Emergency", THIS_WEEK: "This Week", FLEXIBLE: "Flexible" };

type VTab = "radar" | "mine" | "earnings" | "available" | "skills" | "buy";
const V_TABS: { id: VTab; label: string; icon: any }[] = [
  { id: "radar", label: "Radar", icon: "radio" },
  { id: "mine", label: "Jobs", icon: "construct" },
  { id: "earnings", label: "Earn", icon: "cash" },
  { id: "available", label: "Live", icon: "location" },
  { id: "skills", label: "Skills", icon: "ribbon" },
  { id: "buy", label: "Buy", icon: "cart" },
];

export default function App() {
  return (
    <ThemeProvider>
      <AppRoot />
    </ThemeProvider>
  );
}

function AppRoot() {
  const t = useTheme();
  const [loggedIn, setLoggedIn] = useState(!!getToken());
  const [busy, setBusy] = useState(false);
  const [userId, setUid] = useState<string | null>(null);

  useEffect(() => { ensureFonts(); }, []);

  const onDevLogin = useCallback(async () => {
    setBusy(true);
    try {
      const res = await api.devLogin();
      setToken(res.accessToken);
      const uid = (res.user as { user_id?: string }).user_id ?? null;
      if (uid) { setUserId(uid); setUid(uid); joinUser(uid); }
      setLoggedIn(true);
    } finally { setBusy(false); }
  }, []);

  const handleLoginSuccess = async (token: string, name: string, uid: string) => {
    setToken(token);
    setUserId(uid);
    setUid(uid);
    joinUser(uid);
    setLoggedIn(true);
  };

  const logout = () => { setToken(null); setLoggedIn(false); setUid(null); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg, ...(Platform.OS === "web" ? { maxWidth: 520, width: "100%", alignSelf: "center", borderLeftWidth: 1, borderRightWidth: 1, borderColor: t.hairline } : {}) }}>
      <ExpoStatusBar style={t.mode === "light" ? "dark" : "light"} />
      <StatusBar barStyle={t.mode === "light" ? "dark-content" : "light-content"} />
      {loggedIn ? <Home userId={userId ?? undefined} onLogout={logout} /> : (
        <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
          <View style={{ alignItems: "center", marginBottom: 24 }}>
            <Image source={require("./assets/logo-wide.png")} style={{ width: 230, height: 92, resizeMode: "contain" }} />
            <Text style={{ fontSize: 13, color: t.fgMuted }}>Pro · your tool for the field</Text>
          </View>
          <FirebaseLogin onSuccess={handleLoginSuccess} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Login({ onLogin, busy }: { onLogin: () => void; busy: boolean }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  return (
    <View style={s.loginWrap}>
      <View style={{ alignItems: "center", marginBottom: 36 }}>
        <Image source={require("./assets/logo-wide.png")} style={{ width: 230, height: 92, resizeMode: "contain" }} />
        <Text style={s.brandSub}>Pro · your tool for the field</Text>
      </View>
      <Text style={s.heroTitle}>Win jobs.{"\n"}Get paid fairly.</Text>
      <Text style={s.sub}>Bid on jobs in your trade, fund parts in-app, never chase an invoice.</Text>
      <View style={{ marginTop: 28 }}>
        <GradientButton label="Continue as Vendor" busy={busy} onPress={onLogin} />
      </View>
    </View>
  );
}

function Home({ userId, onLogout }: { userId?: string; onLogout: () => void }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const [tab, setTab] = useState<VTab>("radar");
  const [jobs, setJobs] = useState<FeedJob[]>([]);
  const [myJobs, setMyJobs] = useState<MyJob[]>([]);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidJob, setBidJob] = useState<FeedJob | null>(null);
  const [activeJob, setActiveJob] = useState<MyJob | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [feed, me, mine] = await Promise.all([api.feed(), api.me(), api.myJobs()]);
      setJobs(feed); setProfile(me); setMyJobs(mine);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (tab === "radar" || tab === "mine") load(); }, [load, tab]);

  const onBidSubmitted = (jobId: string) => { setJobs((prev) => prev.filter((j) => j.job_id !== jobId)); setBidJob(null); };
  const titleFor: Record<VTab, string> = { radar: "Job Radar", mine: "My Jobs", earnings: "Earnings", available: "Available Now", skills: "My Skills", buy: "Buy & Source" };

  return (
    <View style={{ flex: 1 }}>
      <View style={s.topbar}>
        <View style={s.brandRowSmall}>
          <Image source={require("./assets/logo.png")} style={{ width: 30, height: 30, resizeMode: "contain" }} />
          <Text style={s.pageTitle}>{titleFor[tab]}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {profile && <View style={s.statPill}><Text style={s.statPillText}>{profile.rating_avg}★ · {profile.jobs_completed_count}</Text></View>}
          <Pressable onPress={() => setSettingsOpen(true)} style={s.gearBtn}><Ionicons name="settings-outline" size={18} color={t.fgMuted} /></Pressable>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {tab === "radar" && (loading ? <ActivityIndicator color={t.primary} style={{ marginTop: 40 }} /> : (
          <FlatList
            data={jobs} keyExtractor={(j) => j.job_id} contentContainerStyle={{ padding: 16, gap: 12 }}
            onRefresh={load} refreshing={false}
            ListEmptyComponent={<Text style={s.empty}>No open jobs in your trade right now. Pull to refresh.</Text>}
            renderItem={({ item }) => (
              <Card style={{ gap: 10 }}>
                <View style={s.jobHead}>
                  <Text style={s.jobCat}>{item.category_id}</Text>
                  <UrgencyPill urgency={item.urgency} />
                </View>
                <Text style={s.jobDesc}>{item.description}</Text>
                <GradientButton label="Place bid" onPress={() => setBidJob(item)} />
              </Card>
            )}
          />
        ))}

        {tab === "mine" && (
          <FlatList
            data={myJobs} keyExtractor={(j) => j.job_id} contentContainerStyle={{ padding: 16, gap: 12 }}
            onRefresh={load} refreshing={false}
            ListEmptyComponent={<Text style={s.empty}>No active jobs yet. Win a bid to see it here.</Text>}
            renderItem={({ item }) => (
              <Pressable onPress={() => setActiveJob(item)}>
                <Card style={{ gap: 10 }}>
                  <View style={s.jobHead}>
                    <Text style={s.jobCat}>{item.category_id}</Text>
                    <Pill label={item.status} tone="info" />
                  </View>
                  <Text style={s.jobDesc}>{item.description}</Text>
                </Card>
              </Pressable>
            )}
          />
        )}

        {tab === "earnings" && <EarningsScreen userId={userId} />}
        {tab === "available" && <AvailabilityScreen userId={userId} />}
        {tab === "skills" && <SkillsScreen />}
        {tab === "buy" && <ServicesScreen />}
      </View>

      <View style={s.tabBar}>
        {V_TABS.map((tb) => (
          <Pressable key={tb.id} style={s.tabItem} onPress={() => setTab(tb.id)}>
            {tab === tb.id && <View style={s.tabActive} />}
            <Ionicons name={tb.icon} size={20} color={tab === tb.id ? t.primary : t.fgFaint} />
            <Text style={[s.tabItemLabel, tab === tb.id && { color: t.primary }]}>{tb.label}</Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={!!bidJob} transparent animationType="fade" onRequestClose={() => setBidJob(null)}>
        {bidJob && <BidModal job={bidJob} onClose={() => setBidJob(null)} onSubmitted={onBidSubmitted} />}
      </Modal>
      <Modal visible={!!activeJob} transparent animationType="slide" onRequestClose={() => setActiveJob(null)}>
        {activeJob && <JobDetailModal job={activeJob} userId={userId} onClose={() => setActiveJob(null)} />}
      </Modal>
      <Modal visible={settingsOpen} transparent animationType="slide" onRequestClose={() => setSettingsOpen(false)}>
        <View style={s.settingsBackdrop}>
          <View style={s.settingsSheet}>
            <SettingsScreen userName={profile ? "Khalid" : "Vendor"} onLogout={() => { setSettingsOpen(false); onLogout(); }} />
            <GhostButton label="Close" onPress={() => setSettingsOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function UrgencyPill({ urgency }: { urgency: string }) {
  const tone = urgency === "EMERGENCY" ? "danger" : urgency === "THIS_WEEK" ? "gold" : "muted";
  return <Pill label={URGENCY_LABEL[urgency] ?? urgency} tone={tone as any} />;
}

function BidModal({ job, onClose, onSubmitted }: { job: FeedJob; onClose: () => void; onSubmitted: (jobId: string) => void }) {
  const s = useStyles(makeStyles);
  const [price, setPrice] = useState(20);
  const [warrantyDays, setWarrantyDays] = useState(7);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (price <= 0) return;
    setSubmitting(true);
    try {
      await api.submitBid({
        jobId: job.job_id, bidAmount: price,
        proposedMilestones: [
          { label: "Verified Completion", pct: 60 },
          { label: "Warranty Halfway", pct: 10 },
          { label: "Warranty Cleared", pct: 10 },
          { label: "Platform", pct: 20 },
        ],
      });
      // Bind the proposed warranty term immediately after the bid lands.
      await api.proposeWarranty(job.job_id, warrantyDays).catch(() => undefined);
      onSubmitted(job.job_id);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    } finally { setSubmitting(false); }
  };

  return (
    <View style={s.modalBg}>
      <View style={s.modalCard}>
        <Text style={s.modalTitle}>Bid on {job.category_id}</Text>
        <Text style={s.modalSub}>{job.description}</Text>
        <View style={{ gap: 18, marginTop: 4 }}>
          <LabeledSlider label="Labor price (Khidmah)" value={price} min={1} max={300} step={1} suffix="OMR" onChange={setPrice} />
          <LabeledSlider label="Warranty coverage" value={warrantyDays} min={0} max={90} step={1} suffix="days" onChange={setWarrantyDays} />
        </View>
        <Text style={s.payoutNote}>60% on verified completion · 10% at warranty halfway · 10% on full clearance</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          <GhostButton label="Cancel" onPress={onClose} style={{ flex: 1 }} />
          <GradientButton label="Submit bid" busy={submitting} onPress={submit} style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

function JobDetailModal({ job, userId, onClose }: { job: MyJob; userId?: string; onClose: () => void }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const [warranty, setWarranty] = useState<WarrantyTerms | null>(null);
  const [payout, setPayout] = useState<PayoutSchedule | null>(null);
  const [parts, setParts] = useState<PartsFundingRequest[]>([]);
  const [days, setDays] = useState(7);
  const [partsDesc, setPartsDesc] = useState("");
  const [partsAmount, setPartsAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [w, p, list] = await Promise.all([
      api.getWarranty(job.job_id).catch(() => null),
      api.getPayoutSchedule(job.job_id).catch(() => null),
      api.listParts(job.job_id).catch(() => []),
    ]);
    setWarranty(w); setPayout(p); setParts(list);
  }, [job.job_id]);
  useEffect(() => { load(); }, [load]);

  const proposeWarranty = async () => {
    if (days < 0) return;
    setBusy(true);
    try { await api.proposeWarranty(job.job_id, days); await load(); } finally { setBusy(false); }
  };
  const agreeWarranty = async () => { setBusy(true); try { await api.agreeWarranty(job.job_id); await load(); } finally { setBusy(false); } };
  const requestParts = async () => {
    const amt = parseFloat(partsAmount);
    if (!partsDesc.trim() || !amt || amt <= 0) return;
    setBusy(true);
    try { await api.requestParts(job.job_id, partsDesc, amt); setPartsDesc(""); setPartsAmount(""); await load(); } finally { setBusy(false); }
  };
  const onMyWay = async () => { try { await api.startTracking(job.job_id); alert("Tracking on — consumer can see you en route."); } catch (e) { alert(e instanceof Error ? e.message : String(e)); } };
  const arrived = async () => { try { await api.arrive(job.job_id); alert("Arrived — tracking ended."); } catch (e) { alert(e instanceof Error ? e.message : String(e)); } };
  const uploadVendorAfter = async () => {
    setBusy(true);
    try {
      const { pickAndUpload } = await import("./upload");
      const url = await pickAndUpload("completion");
      if (url) { await api.uploadPhoto(job.job_id, "VENDOR_AFTER", url); alert("'After' photo sent. Consumer will confirm completion."); }
    } catch (e) { alert(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  };

  return (
    <View style={s.modalBg}>
      <View style={[s.modalCard, { maxHeight: "88%" }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={s.modalTitle}>{job.category_id} job</Text>
          <Text style={s.modalSub}>{job.description}</Text>

          <Text style={s.sectionLabel}>On-site</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <GhostButton label="On my way" onPress={onMyWay} style={{ flex: 1 }} />
            <GhostButton label="Arrived" onPress={arrived} style={{ flex: 1 }} />
          </View>
          <View style={{ marginTop: 10 }}>
            <GradientButton label="Send after photo" icon="camera" busy={busy} onPress={uploadVendorAfter} />
          </View>

          <Text style={s.sectionLabel}>Warranty</Text>
          {warranty ? (
            <Card style={{ gap: 8, marginBottom: 10 }}>
              <Text style={s.infoLine}>Status: {warranty.status}</Text>
              <Text style={s.infoLine}>
                Proposed {warranty.proposed_days}d
                {warranty.countered_days != null ? ` · countered ${warranty.countered_days}d` : ""}
                {warranty.agreed_days != null ? ` · agreed ${warranty.agreed_days}d` : ""}
              </Text>
              {warranty.status !== "AGREED" && <GradientButton label="Agree to terms" busy={busy} onPress={agreeWarranty} />}
            </Card>
          ) : (
            <Card style={{ gap: 12, marginBottom: 10 }}>
              <LabeledSlider label="Propose warranty" value={days} min={0} max={90} step={1} suffix="days" onChange={setDays} />
              <GradientButton label="Propose" busy={busy} onPress={proposeWarranty} />
            </Card>
          )}

          {payout && (
            <>
              <Text style={s.sectionLabel}>Payout schedule</Text>
              <Card style={{ gap: 6, marginBottom: 10 }}>
                <Text style={s.infoLine}>Total: {payout.total_amount} OMR</Text>
                <Text style={s.infoLine}>Immediate (60%): {payout.vendor_immediate_amount} {payout.immediate_released_at ? "✓" : "pending"}</Text>
                <Text style={s.infoLine}>Halfway (10%): {payout.vendor_halfway_amount} {payout.halfway_released_at ? "✓" : "pending"}</Text>
                <Text style={s.infoLine}>Final (10%): {payout.vendor_final_amount} {payout.final_released_at ? "✓" : "pending"}</Text>
              </Card>
            </>
          )}

          <Text style={s.sectionLabel}>Parts funding</Text>
          {parts.map((p) => (
            <Card key={p.request_id} style={{ gap: 4, marginBottom: 8 }}>
              <Text style={s.infoLine}>{p.description}</Text>
              <Text style={s.infoLine}>{p.amount} OMR · {p.status}</Text>
            </Card>
          ))}
          <Card style={{ gap: 8 }}>
            <Text style={s.label}>Request parts</Text>
            <TextInput style={s.input} placeholder="What part?" placeholderTextColor={t.fgFaint} value={partsDesc} onChangeText={setPartsDesc} />
            <TextInput style={s.input} placeholder="Amount, OMR" placeholderTextColor={t.fgFaint} keyboardType="decimal-pad" value={partsAmount} onChangeText={setPartsAmount} />
            <GradientButton label="Send to consumer" busy={busy} onPress={requestParts} />
          </Card>
        </ScrollView>
        <GhostButton label="Close" onPress={onClose} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  loginWrap: { flex: 1, padding: 24, paddingTop: 72, justifyContent: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 44 },
  brandRowSmall: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  brandMarkText: { fontWeight: "900", fontSize: 22, color: t.primaryInk, fontFamily: t.font },
  brandName: { color: t.fg, fontWeight: "900", fontSize: 20, fontFamily: t.font },
  brandSub: { color: t.fgMuted, fontSize: 13, fontFamily: t.font },
  heroTitle: { color: t.fg, fontWeight: "900", fontSize: 32, lineHeight: 38, marginBottom: 12, fontFamily: t.font, letterSpacing: -1 },
  sub: { color: t.fgMuted, fontSize: 15, lineHeight: 22, fontFamily: t.font },

  logoMark: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  logoMarkText: { color: t.primaryInk, fontWeight: "900", fontSize: 16, fontFamily: t.font },

  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 14 },
  pageTitle: { color: t.fg, fontWeight: "900", fontSize: 22, fontFamily: t.font, letterSpacing: -0.5 },
  statPill: { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  statPillText: { color: t.gold, fontWeight: "700", fontSize: 12, fontFamily: t.font },
  gearBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, alignItems: "center", justifyContent: "center" },

  sectionLabel: { color: t.fg, fontWeight: "800", fontSize: 14, marginTop: 18, marginBottom: 8, fontFamily: t.font },
  infoLine: { color: t.fgMuted, fontSize: 13, lineHeight: 19, fontFamily: t.font },
  label: { color: t.fgMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 6, fontFamily: t.font },
  empty: { color: t.fgMuted, textAlign: "center", marginTop: 40, fontSize: 14, fontFamily: t.font },

  jobHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  jobCat: { color: t.fg, fontWeight: "800", fontSize: 16, fontFamily: t.font },
  jobDesc: { color: t.fgMuted, fontSize: 14, lineHeight: 20, fontFamily: t.font },

  input: { backgroundColor: t.bg, borderWidth: 1, borderColor: t.border, borderRadius: t.radiusSm, padding: 13, color: t.fg, fontSize: 16, fontFamily: t.font },
  payoutNote: { color: t.fgMuted, fontSize: 12, marginTop: 10, lineHeight: 17, fontFamily: t.font },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 440, backgroundColor: t.bgElev, borderRadius: t.radiusLg, padding: 22, borderWidth: 1, borderColor: t.hairline },
  modalTitle: { color: t.fg, fontWeight: "900", fontSize: 20, marginBottom: 6, fontFamily: t.font },
  modalSub: { color: t.fgMuted, fontSize: 14, marginBottom: 14, lineHeight: 20, fontFamily: t.font },

  tabBar: { flexDirection: "row", backgroundColor: t.surface, borderTopWidth: 1, borderColor: t.hairline, paddingTop: 8, paddingBottom: 18 },
  tabItem: { flex: 1, alignItems: "center", gap: 2 },
  tabActive: { position: "absolute", top: 0, width: 28, height: 3, borderRadius: 2, backgroundColor: t.primary },
  tabGlyph: { fontSize: 18, opacity: 0.5 },
  tabItemLabel: { color: t.fgMuted, fontSize: 10, fontWeight: "800", fontFamily: t.font },

  settingsBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  settingsSheet: { backgroundColor: t.bg, borderTopLeftRadius: t.radiusLg, borderTopRightRadius: t.radiusLg, height: "90%", paddingBottom: 16, paddingHorizontal: 4 },
});
