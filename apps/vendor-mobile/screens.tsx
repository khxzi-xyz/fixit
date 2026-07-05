import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { Theme } from "./theme";
import { THEMES } from "./theme";
import { useTheme, useThemeControls } from "./ThemeContext";
import {
  api,
  type DirectBounty,
  type PayoutRequest,
  type SkillTag,
  type WalletBalance,
  type WalletTxn,
} from "./api";
import { joinUser, on } from "./realtime";
import { Card, EmptyState, GhostButton, GradientButton, Pill, Rise, SectionTitle, Skeleton, useStyles } from "./ui";

const MUSCAT = { lat: 23.588, lng: 58.3829 };
const fail = (e: unknown) => Alert.alert("Something went wrong", e instanceof Error ? e.message : String(e));
const omr = (n: number) => `${n.toFixed(3)} OMR`;

// =============================================================================
// EARNINGS (Module 04)
// =============================================================================
export function EarningsScreen({ userId }: { userId?: string }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [txns, setTxns] = useState<WalletTxn[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [w, tx, p] = await Promise.all([api.wallet(), api.walletTxns(), api.payouts()]);
      setWallet(w); setTxns(tx); setPayouts(p);
    } catch { /* not ready */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    if (userId) joinUser(userId);
    const off = on("wallet_update", () => load());
    return off;
  }, [load, userId]);

  const requestPayout = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setBusy(true);
    try { await api.requestPayout(amt); setAmount(""); Alert.alert("Payout requested", "We'll settle it on the next payout window."); await load(); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 18, padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <Rise>
        <LinearGradient colors={t.gradMint} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.balanceCard}>
          <Text style={s.balanceLabel}>WALLET BALANCE</Text>
          {loading ? <Skeleton h={40} style={{ marginTop: 8, backgroundColor: "rgba(0,0,0,0.12)" }} /> : <Text style={s.balanceValue}>{wallet ? omr(wallet.balance) : "0.000 OMR"}</Text>}
          {!!wallet?.lockedBalance && <Text style={s.lockNote}>{omr(wallet.lockedBalance)} pending / in escrow</Text>}
        </LinearGradient>
      </Rise>

      <Rise delay={60}>
        <SectionTitle>Cash out</SectionTitle>
        <Card style={{ marginTop: 12, gap: 10 }}>
          <TextInput style={s.input} placeholder="Amount (OMR)" placeholderTextColor={t.fgFaint} keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
          <GradientButton label="Request payout" onPress={requestPayout} busy={busy} />
        </Card>
      </Rise>

      {payouts.length > 0 && (
        <Rise delay={100}>
          <SectionTitle>Payout requests</SectionTitle>
          <View style={{ marginTop: 12, gap: 10 }}>
            {payouts.map((p) => (
              <View key={p.payout_id} style={s.rowCard}>
                <Text style={s.muted}>{omr(p.amount)}</Text>
                <Pill label={p.status} tone={p.status === "PAID" ? "mint" : p.status === "REJECTED" ? "danger" : "gold"} />
              </View>
            ))}
          </View>
        </Rise>
      )}

      <Rise delay={140}>
        <SectionTitle>Activity</SectionTitle>
        <View style={{ marginTop: 12, gap: 10 }}>
          {loading ? <><Skeleton h={56} /><Skeleton h={56} /></> : txns.length === 0 ? (
            <EmptyState icon="cash-outline" title="No earnings yet" body="Win a job and complete it -60% lands instantly, the rest as the warranty clears." />
          ) : txns.map((tx) => (
            <View key={tx.txn_id} style={s.rowCardFlex}>
              <View style={[s.dot, { backgroundColor: tx.amount >= 0 ? t.primarySoft : t.dangerSoft }]}>
                <Text style={{ color: tx.amount >= 0 ? t.primary : t.danger, fontWeight: "800" }}>{tx.amount >= 0 ? "↓" : "↑"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.txnKind}>{tx.kind.replace(/_/g, " ").toLowerCase()}</Text>
                {!!tx.note && <Text style={s.txnNote}>{tx.note}</Text>}
              </View>
              <Text style={[s.txnAmt, { color: tx.amount >= 0 ? t.primary : t.danger }]}>{tx.amount >= 0 ? "+" : ""}{tx.amount.toFixed(3)}</Text>
            </View>
          ))}
        </View>
      </Rise>
    </ScrollView>
  );
}

// =============================================================================
// AVAILABLE NOW + DIRECT BOUNTIES (Module 09)
// =============================================================================
export function AvailabilityScreen({ userId }: { userId?: string }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const [available, setAvailable] = useState(false);
  const [tokens, setTokens] = useState<number | null>(null);
  const [bounties, setBounties] = useState<DirectBounty[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [tk, b] = await Promise.all([api.bidTokens().catch(() => ({ tokens: 0 })), api.directBounties().catch(() => [])]);
      setTokens(tk.tokens); setBounties(b);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    if (userId) joinUser(userId);
    const off = on("direct_bounty", () => load());
    return off;
  }, [load, userId]);

  const toggle = async (val: boolean) => {
    setBusy(true);
    try { await api.setAvailability(val, MUSCAT.lat, MUSCAT.lng); setAvailable(val); }
    catch (e) { fail(e); setAvailable(!val); } finally { setBusy(false); }
  };
  const respond = async (b: DirectBounty, action: "ACCEPT" | "DECLINE") => {
    try { await api.respondBounty(b.bounty_id, action); await load(); } catch (e) { fail(e); }
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 16, padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <Rise>
        <Card glow={available} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={[s.statusDot, { backgroundColor: available ? t.primary : t.fgFaint }]} />
              <Text style={s.cardTitle}>{available ? "You're live on the map" : "You're offline"}</Text>
            </View>
            <Text style={[s.muted, { marginTop: 4 }]}>Toggle on to receive direct bounties from nearby consumers.</Text>
          </View>
          <Switch value={available} onValueChange={toggle} disabled={busy} trackColor={{ true: t.primary, false: t.border }} thumbColor="#fff" />
        </Card>
      </Rise>

      <Rise delay={60}>
        <View style={s.rowCard}>
          <Text style={s.muted}>Bid-back tokens today</Text>
          <Pill label={`${tokens ?? "—"} left`} tone="gold" />
        </View>
      </Rise>

      <Rise delay={120}>
        <SectionTitle>Direct bounties</SectionTitle>
        <View style={{ marginTop: 12, gap: 12 }}>
          {bounties.length === 0 ? (
            <EmptyState icon="flash-outline" title="No direct offers" body="When a consumer taps you on the live map, their bounty lands here." />
          ) : bounties.map((b) => (
            <Card key={b.bounty_id} style={{ gap: 10 }}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>{b.category_id ?? "Direct job"}</Text>
                <Text style={s.priceTag}>{omr(Number(b.offered_price))}</Text>
              </View>
              {!!b.note && <Text style={s.muted}>{b.note}</Text>}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <GradientButton label="Accept" onPress={() => respond(b, "ACCEPT")} style={{ flex: 1 }} />
                <GhostButton label="Decline" danger onPress={() => respond(b, "DECLINE")} style={{ flex: 1 }} />
              </View>
            </Card>
          ))}
        </View>
      </Rise>
    </ScrollView>
  );
}

// =============================================================================
// SKILLS (Module 02) -with real proof upload
// =============================================================================
const SKILL_CATS = [
  { id: "AC", label: "AC & Cooling" },
  { id: "ELECTRICAL", label: "Electrical" },
  { id: "PLUMBING", label: "Plumbing" },
  { id: "SECURITY", label: "Security" },
  { id: "HANDYMAN", label: "Handyman" },
];

export function SkillsScreen() {
  const s = useStyles(makeStyles);
  const [tags, setTags] = useState<SkillTag[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setTags(await api.mySkillTags()); } catch { setTags([]); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const request = async (categoryId: string) => {
    setBusy(categoryId);
    try {
      const { pickAndUpload } = await import("./upload");
      const url = await pickAndUpload("skill-proof");
      await api.requestSkillTag(categoryId, url ?? "https://picsum.photos/seed/work/400", "Proof of past work");
      await load();
    } catch (e) { fail(e); } finally { setBusy(null); }
  };
  const statusOf = (cat: string) => tags.find((tg) => tg.category_id === cat)?.status;

  return (
    <ScrollView contentContainerStyle={{ gap: 14, padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <Rise>
        <Text style={s.h1}>My skills</Text>
        <Text style={[s.muted, { marginTop: 4 }]}>Add a skill with a proof photo. Admin approves per-skill -you only see jobs you're cleared for.</Text>
      </Rise>
      <Rise delay={60}>
        <View style={{ gap: 10 }}>
          {SKILL_CATS.map((cat) => {
            const status = statusOf(cat.id);
            return (
              <View key={cat.id} style={s.rowCard}>
                <Text style={s.cardTitle}>{cat.label}</Text>
                {status ? (
                  <Pill label={status} tone={status === "APPROVED" ? "mint" : status === "REJECTED" ? "danger" : "gold"} />
                ) : (
                  <Pressable style={s.smallBtn} onPress={() => request(cat.id)} disabled={!!busy}>
                    <Text style={s.smallBtnText}>{busy === cat.id ? "Uploading…" : "+ Add proof"}</Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>
      </Rise>
    </ScrollView>
  );
}

// =============================================================================
// SERVICES -vendor actions on new modules (Junk / Cars / Market)
// =============================================================================
type Seg = "junk" | "cars" | "market" | "diag";
export function ServicesScreen() {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const [seg, setSeg] = useState<Seg>("junk");
  return (
    <ScrollView contentContainerStyle={{ gap: 16, padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <Rise>
        <Text style={s.h1}>Buy & source</Text>
        <View style={s.segBar}>
          {([["junk", "Junk"], ["cars", "Cars"], ["market", "Goods"], ["diag", "Diag"]] as [Seg, string][]).map(([id, label]) => (
            <Pressable key={id} onPress={() => setSeg(id)} style={[s.segItem, seg === id && { backgroundColor: t.primary }]}>
              <Text style={[s.segText, seg === id && { color: t.primaryInk }]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </Rise>
      {seg === "junk" && <VendorJunk />}
      {seg === "cars" && <VendorCars />}
      {seg === "market" && <VendorMarket />}
      {seg === "diag" && <VendorDiag />}
    </ScrollView>
  );
}

function VendorDiag() {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const [passId, setPassId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const log = async (outcome: "CANNOT_DIAGNOSE" | "DIAGNOSED") => {
    if (!passId.trim()) { Alert.alert("Scan a pass", "Enter the customer's Diagnostic Pass ID."); return; }
    setBusy(true);
    try {
      await api.diagnosticVisit(passId.trim(), outcome, note || undefined);
      Alert.alert(outcome === "DIAGNOSED" ? "Diagnosis logged" : "Pass released", outcome === "DIAGNOSED" ? "You earned 1 OMR; 2 OMR rolls into the repair." : "The pass stays untouched for the next shop.");
      setPassId(""); setNote("");
    } catch (e) { fail(e); } finally { setBusy(false); }
  };

  return (
    <View style={{ gap: 12 }}>
      <Text style={s.muted}>Customer brings an item with a rolling Diagnostic Pass. Solve it to earn 1 OMR now + 2 OMR into the repair (Module 18).</Text>
      <Card style={{ gap: 10 }}>
        <TextInput style={s.input} placeholder="Diagnostic Pass ID (QR)" placeholderTextColor={t.fgFaint} value={passId} onChangeText={setPassId} autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Diagnosis note (optional)" placeholderTextColor={t.fgFaint} value={note} onChangeText={setNote} />
        <GradientButton label="Diagnosed -claim 1 OMR" busy={busy} onPress={() => log("DIAGNOSED")} />
        <GhostButton label="Cannot diagnose -release pass" onPress={() => log("CANNOT_DIAGNOSE")} />
      </Card>
    </View>
  );
}

function VendorJunk() {
  const s = useStyles(makeStyles);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { setRows(await api.junkListings()); } catch { setRows([]); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const bid = async (j: any) => {
    try { await api.bidJunk(j.junk_id, 8, "within the hour"); Alert.alert("Offer placed", "You bid 8 OMR. If accepted, you get a pickup QR."); }
    catch (e) { fail(e); }
  };
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.muted}>Scrap & junk posted nearby. Bid cash to collect it (Module 22).</Text>
      {loading ? <Skeleton h={90} /> : rows.length === 0 ? (
        <EmptyState icon="trash-bin-outline" title="No junk nearby" body="Geofenced scrap listings appear here for Pro/Elite shops." />
      ) : rows.map((j, i) => (
        <Rise key={j.junk_id} delay={i * 40}>
          <Card style={{ gap: 8 }}>
            <View style={s.rowBetween}><Text style={s.cardTitle}>{j.title}</Text><Pill label={j.status} tone="gold" /></View>
            <GradientButton label="Bid 8 OMR to collect" variant="gold" onPress={() => bid(j)} />
          </Card>
        </Rise>
      ))}
    </View>
  );
}

function VendorCars() {
  const s = useStyles(makeStyles);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { setRows(await api.highTicketListings()); } catch { setRows([]); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.muted}>High-ticket listings (Module 20). Contact stays masked until Lead-Lock.</Text>
      {loading ? <Skeleton h={100} /> : rows.length === 0 ? (
        <EmptyState icon="car-outline" title="No vehicles listed" body="Cars and property list here." />
      ) : rows.map((l, i) => (
        <Rise key={l.listing_id} delay={i * 40}>
          <Card style={{ gap: 6 }}>
            <View style={s.rowBetween}><Text style={s.cardTitle}>{l.title}</Text><Pill label={l.item_class} tone="info" /></View>
            <Text style={s.priceTag}>{Number(l.asking_price).toLocaleString()} OMR</Text>
          </Card>
        </Rise>
      ))}
    </View>
  );
}

function VendorMarket() {
  const s = useStyles(makeStyles);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => { try { setRows(await api.marketListings()); } catch { setRows([]); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  return (
    <View style={{ gap: 12 }}>
      <Text style={s.muted}>Peer goods for sale nearby (Module 19).</Text>
      {loading ? <Skeleton h={100} /> : rows.length === 0 ? (
        <EmptyState icon="cart-outline" title="Nothing listed" body="Goods appear here." />
      ) : rows.map((l, i) => (
        <Rise key={l.listing_id} delay={i * 40}>
          <Card style={{ gap: 6 }}>
            <View style={s.rowBetween}><Text style={s.cardTitle}>{l.title}</Text><Pill label={l.sale_kind} tone={l.sale_kind === "AUCTION" ? "info" : "mint"} /></View>
            <Text style={s.priceTag}>{omr(Number(l.price ?? 0))}</Text>
          </Card>
        </Rise>
      ))}
    </View>
  );
}

// =============================================================================
// SETTINGS -theme + Pro/Elite subscription
// =============================================================================
export function SettingsScreen({ userName, onLogout }: { userName?: string; onLogout: () => void }) {
  const t = useTheme();
  const s = useStyles(makeStyles);
  const { themeKey, setTheme, keys } = useThemeControls();
  const [plans, setPlans] = useState<any[]>([]);
  const [myPlan, setMyPlan] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [p, mine] = await Promise.all([api.plans().catch(() => []), api.myPlan().catch(() => null)]);
      setPlans((p as any[]).filter((pl) => pl.audience === "VENDOR" || pl.audience === "BOTH"));
      setMyPlan(mine?.plan_id ?? null);
    } catch { /* ignore */ }
  }, []);
  useEffect(() => { load(); }, [load]);

  const subscribe = async (planId: string) => {
    setBusy(true);
    try { await api.subscribe(planId); Alert.alert("Subscribed", "Pro features unlocked."); await load(); }
    catch (e) { const m = e instanceof Error ? e.message : String(e); Alert.alert(m.toLowerCase().includes("top up") ? "Top up needed" : "Couldn't subscribe", m); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ gap: 18, padding: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <Rise>
        <Text style={s.h1}>Settings</Text>
        <Text style={s.muted}>Signed in as {userName || "you"}{myPlan ? ` · ${myPlan}` : ""}</Text>
      </Rise>

      <Rise delay={40}>
        <SectionTitle>Upgrade</SectionTitle>
        <View style={{ marginTop: 12, gap: 10 }}>
          {plans.length === 0 ? <Text style={s.muted}>Plans load here.</Text> : plans.map((pl) => (
            <Card key={pl.plan_id} style={{ gap: 8 }}>
              <View style={s.rowBetween}>
                <Text style={s.cardTitle}>{pl.display_name}</Text>
                <Text style={s.priceTag}>{Number(pl.monthly_fee_omr).toFixed(0)} OMR<Text style={s.muted}>/mo</Text></Text>
              </View>
              {myPlan === pl.plan_id ? <Pill label="Active" tone="mint" /> : <GradientButton label={`Get ${pl.display_name}`} busy={busy} onPress={() => subscribe(pl.plan_id)} />}
            </Card>
          ))}
        </View>
      </Rise>

      <Rise delay={80}>
        <SectionTitle>Appearance</SectionTitle>
        <View style={{ marginTop: 12, gap: 12 }}>
          {keys.map((k) => {
            const p = THEMES[k];
            const active = themeKey === k;
            return (
              <Pressable key={k} onPress={() => setTheme(k)} style={[s.themeRow, active && { borderColor: t.primary }]}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={[s.swatchWrap, { backgroundColor: p.bg, borderColor: p.border }]}>
                    <View style={[s.swatch, { backgroundColor: p.primary }]} />
                    <View style={[s.swatch, { backgroundColor: p.accent }]} />
                    <View style={[s.swatch, { backgroundColor: p.gold }]} />
                  </View>
                  <View><Text style={s.cardTitle}>{p.name}</Text><Text style={s.muted}>{p.mode === "light" ? "Light" : "Dark"} theme</Text></View>
                </View>
                <View style={[s.radio, active && { borderColor: t.primary, backgroundColor: t.primary }]}>{active && <Text style={{ color: t.primaryInk, fontWeight: "900", fontSize: 12 }}>✓</Text>}</View>
              </Pressable>
            );
          })}
        </View>
      </Rise>

      <Rise delay={120}>
        <Card style={{ marginTop: 4 }}>
          <Pressable onPress={onLogout} style={{ paddingVertical: 6 }}><Text style={{ color: t.danger, fontWeight: "800", fontFamily: t.font }}>Log out</Text></Pressable>
        </Card>
      </Rise>
    </ScrollView>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  h1: { color: t.fg, fontWeight: "900", fontSize: 26, fontFamily: t.font, letterSpacing: -0.5 },
  muted: { color: t.fgMuted, fontSize: 13.5, lineHeight: 20, fontFamily: t.font },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },

  balanceCard: { borderRadius: t.radiusLg, padding: 26, gap: 6, ...t.shadowGlow },
  balanceLabel: { color: t.primaryInk, opacity: 0.7, fontWeight: "800", fontSize: 11, letterSpacing: 1.2, fontFamily: t.font },
  balanceValue: { color: t.primaryInk, fontWeight: "900", fontSize: 38, fontFamily: t.font, letterSpacing: -1 },
  lockNote: { color: t.primaryInk, opacity: 0.8, fontSize: 13, fontWeight: "600", fontFamily: t.font },

  input: { backgroundColor: t.bg, borderWidth: 1, borderColor: t.border, borderRadius: t.radiusSm, padding: 13, color: t.fg, fontSize: 16, fontFamily: t.font },

  rowCard: { backgroundColor: t.surface, borderRadius: t.radiusSm, padding: 16, borderWidth: 1, borderColor: t.hairline, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowCardFlex: { backgroundColor: t.surface, borderRadius: t.radiusSm, padding: 14, borderWidth: 1, borderColor: t.hairline, flexDirection: "row", alignItems: "center", gap: 12 },
  dot: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statusDot: { width: 9, height: 9, borderRadius: 5 },

  cardTitle: { color: t.fg, fontWeight: "800", fontSize: 16, fontFamily: t.font },
  priceTag: { color: t.primary, fontWeight: "900", fontSize: 18, fontFamily: t.font },

  txnKind: { color: t.fg, fontWeight: "700", fontSize: 13.5, textTransform: "capitalize", fontFamily: t.font },
  txnNote: { color: t.fgFaint, fontSize: 12, marginTop: 1, fontFamily: t.font },
  txnAmt: { fontWeight: "800", fontSize: 15.5, fontFamily: t.font },

  smallBtn: { backgroundColor: t.primarySoft, borderWidth: 1, borderColor: t.hairline, paddingHorizontal: 14, paddingVertical: 9, borderRadius: t.radiusPill },
  smallBtnText: { color: t.primary, fontWeight: "800", fontSize: 12.5, fontFamily: t.font },

  segBar: { flexDirection: "row", gap: 4, marginTop: 14, backgroundColor: t.surface, borderWidth: 1, borderColor: t.hairline, borderRadius: t.radiusPill, padding: 4 },
  segItem: { flex: 1, alignItems: "center", paddingVertical: 9, borderRadius: t.radiusPill },
  segText: { color: t.fgMuted, fontWeight: "800", fontSize: 12.5, fontFamily: t.font },

  themeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: t.surface, borderWidth: 1.5, borderColor: t.hairline, borderRadius: t.radius, padding: 14 },
  swatchWrap: { flexDirection: "row", gap: 3, padding: 6, borderRadius: 10, borderWidth: 1 },
  swatch: { width: 14, height: 24, borderRadius: 4 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: t.border, alignItems: "center", justifyContent: "center" },
});
