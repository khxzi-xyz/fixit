import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import logoAsset from "@/assets/logo.png.asset.json";
import { api, getToken, setToken as persistToken } from "@/lib/api";

export const LOGO_URL = logoAsset.url;

export type Role = "consumer" | "vendor";

export type Bid = {
  id: string; vendorCode: string; rating: number; jobsCompleted: number;
  completionRate: number; warrantyDays: number; amount: number; pro: boolean;
};
export type Voucher = { code: string; type: "credit" | "plan" | "fee"; amount: number; label: string };
export type Listing = {
  id: string; title: string; price: number; kind: "fixed" | "auction" | "junk";
  seller: string; area: string; emoji: string; topBid?: number;
};
export type WarrantyClaim = { id: string; jobTitle: string; raisedAgo: string; status: "open" | "scheduled" | "ignored" };

export function topUpBonus(amount: number): number {
  if (amount >= 30) return 5;
  if (amount >= 20) return 3;
  if (amount >= 10) return 1;
  return 0;
}
export function feeRate(jobOMR: number): number {
  if (jobOMR >= 50) return 0.08;
  if (jobOMR > 15) return 0.12;
  return 0.2;
}

type Ctx = {
  token: string | null;
  userName: string;
  authReady: boolean;
  login: (role: Role) => Promise<void>;
  requestOtp: (phone: string) => Promise<{ devCode?: string }>;
  verifyOtp: (phone: string, code: string, role: Role, name?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;

  role: Role; setRole: (r: Role) => void;
  walletOMR: number;
  topUp: (n: number) => { credited: number; bonus: number };
  spend: (n: number) => boolean;
  bids: Bid[];
  activeJobId: string | null;
  lockedBidId: string | null;
  lockBid: (id: string) => void;
  escrowStage: 0 | 1 | 2 | 3;
  advanceEscrow: () => void;
  resetEscrow: () => void;
  isPlus: boolean; setPlus: (v: boolean) => void;
  isPro: boolean; setPro: (v: boolean) => void;
  vendorPhoto: boolean; consumerPhoto: boolean;
  setVendorPhoto: (v: boolean) => void; setConsumerPhoto: (v: boolean) => void;
  vouchers: Voucher[];
  redeemVoucher: (code: string) => Voucher | null;
  listings: Listing[];
  placeBid: (id: string, amount: number) => void;
  vendorWallet: number; lockedWarrantyPool: number;
  bidTokens: number; useBidToken: () => boolean; refundBidToken: () => void;
  busy: boolean; setBusy: (v: boolean) => void;
  availableNow: boolean; setAvailableNow: (v: boolean) => void;
  strikes: number; addStrike: () => void;
  warrantyClaims: WarrantyClaim[];
  resolveClaim: (id: string, action: "schedule" | "ignore") => void;
  skills: { name: string; status: "approved" | "pending" }[];
  addSkill: (name: string) => void;
  receipts: { id: string; store: string; amount: number }[];
  addReceipt: (store: string, amount: number) => void;
  approveParts: () => void;
  partsApproved: boolean;
  diagnosticPassActive: boolean;
  buyDiagnosticPass: () => void;
  releaseDiagnosticPass: () => void;
};

const AppCtx = createContext<Ctx | null>(null);

function mapListing(l: any): Listing {
  const kind = l.sale_kind === "AUCTION" ? "auction" : "fixed";
  return { id: l.listing_id, title: l.title, price: Number(l.price ?? 0), kind, seller: `Seller #${String(l.seller_id).slice(0, 4)}`, area: "Oman", emoji: "📦", topBid: l.sale_kind === "AUCTION" ? Number(l.price ?? 0) : undefined };
}
function mapBid(b: any): Bid {
  const warranty = (b.proposed_milestones ?? []).find((m: any) => /warranty/i.test(m.label))?.pct ?? 0;
  return { id: b.bid_id, vendorCode: `Vendor #${String(b.vendor_id).slice(0, 4).toUpperCase()}`, rating: 0, jobsCompleted: 0, completionRate: 0, warrantyDays: warranty, amount: Number(b.bid_amount), pro: false };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [token, setTok] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState<Role>("consumer");

  const [walletOMR, setWallet] = useState(0);
  const [bids, setBids] = useState<Bid[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [lockedBidId, setLockedBidId] = useState<string | null>(null);
  const [escrowStage, setEscrowStage] = useState<0 | 1 | 2 | 3>(0);
  const [isPlus, setPlus] = useState(false);
  const [isPro, setPro] = useState(false);
  const [vendorPhoto, setVendorPhoto] = useState(false);
  const [consumerPhoto, setConsumerPhoto] = useState(false);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [vendorWallet, setVendorWallet] = useState(0);
  const [lockedWarrantyPool, setLockedPool] = useState(0);
  const [bidTokens, setBidTokens] = useState(5);
  const [busy, setBusy] = useState(false);
  const [availableNow, setAvailableNowState] = useState(false);
  const [strikes, setStrikes] = useState(0);
  const [warrantyClaims, setClaims] = useState<WarrantyClaim[]>([]);
  const [skills, setSkills] = useState<{ name: string; status: "approved" | "pending" }[]>([]);
  const [receipts, setReceipts] = useState<{ id: string; store: string; amount: number }[]>([]);
  const [partsApproved, setPartsApproved] = useState(false);
  const [diagnosticPassActive, setDiag] = useState(false);

  async function hydrate(r: Role) {
    try {
      const w = await api.wallet();
      if (r === "vendor") { setVendorWallet(w.balance); setLockedPool(w.lockedBalance); }
      else setWallet(w.balance);
    } catch { /* not ready */ }
    if (r === "consumer") {
      try {
        const jobs = await api.myJobs();
        const active = jobs.find((j) => j.status === "OPEN" || j.status === "BID_SELECTED") ?? jobs[0];
        if (active) { setActiveJobId(active.job_id); try { setBids((await api.jobBids(active.job_id)).map(mapBid)); } catch { /**/ } }
      } catch { /**/ }
      try { setListings((await api.marketListings()).map(mapListing)); } catch { /**/ }
    } else {
      try { const tk = await api.bidTokens(); setBidTokens(tk.tokens); } catch { /**/ }
      try { setSkills((await api.mySkillTags()).map((s: any) => ({ name: s.category_id, status: s.status === "APPROVED" ? "approved" : "pending" }))); } catch { /**/ }
      try { setListings((await api.marketListings()).map(mapListing)); } catch { /**/ }
    }
  }

  useEffect(() => {
    const t = getToken();
    if (t) { setTok(t); hydrate(role).finally(() => setAuthReady(true)); }
    else setAuthReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyAuth(res: { accessToken: string; user: { full_name: string; role: string } }, r: Role) {
    persistToken(res.accessToken);
    setTok(res.accessToken);
    setUserName(res.user.full_name);
    setRole(r);
    await hydrate(r);
  }

  const value = useMemo<Ctx>(() => ({
    token, userName, authReady,
    login: async (r) => { const res = await api.devLogin(r === "vendor" ? "VENDOR" : "CONSUMER"); await applyAuth(res, r); },
    requestOtp: async (phone) => { const res = await api.requestOtp(phone.startsWith("+") ? phone : `+968${phone}`); return { devCode: res.devCode }; },
    verifyOtp: async (phone, code, r, name) => { const res = await api.verifyOtp(phone.startsWith("+") ? phone : `+968${phone}`, code, name, r === "vendor" ? "VENDOR" : "CONSUMER"); await applyAuth(res, r); },
    logout: () => { persistToken(null); setTok(null); setUserName(""); setWallet(0); setBids([]); },
    refresh: () => hydrate(role),

    role, setRole,
    walletOMR,
    topUp: (n) => {
      const bonus = topUpBonus(n);
      setWallet((w) => w + n + bonus);
      api.topup(n).then((res) => setWallet(res.balance)).catch(() => undefined);
      return { credited: n + bonus, bonus };
    },
    spend: (n) => { if (walletOMR < n) return false; setWallet((w) => w - n); return true; },
    bids, activeJobId, lockedBidId,
    lockBid: (id) => {
      setLockedBidId(id); setEscrowStage(1);
      if (activeJobId) api.selectBid(activeJobId, id).then(() => api.wallet().then((w) => setWallet(w.balance))).catch(() => undefined);
    },
    escrowStage,
    advanceEscrow: () => setEscrowStage((s) => (s < 3 ? ((s + 1) as 0 | 1 | 2 | 3) : s)),
    resetEscrow: () => { setEscrowStage(0); setLockedBidId(null); setVendorPhoto(false); setConsumerPhoto(false); setPartsApproved(false); setReceipts([]); },
    isPlus, setPlus, isPro, setPro,
    vendorPhoto, consumerPhoto, setVendorPhoto, setConsumerPhoto,
    vouchers,
    redeemVoucher: (raw) => {
      const code = raw.trim().toUpperCase();
      if (!/^FIXIT-[A-Z0-9]{4}$/.test(code)) return null;
      const tail = code.slice(-1);
      let v: Voucher;
      if ("0123".includes(tail)) v = { code, type: "credit", amount: 5, label: "+5 OMR wallet credit" };
      else if ("456".includes(tail)) v = { code, type: "fee", amount: 50, label: "−50% FixIt fee on next job" };
      else v = { code, type: "plan", amount: 30, label: "30 days FixIt Plus unlocked" };
      setVouchers((vs) => [v, ...vs]);
      if (v.type === "credit") setWallet((w) => w + v.amount);
      if (v.type === "plan") setPlus(true);
      api.redeemVoucher(code).then(() => api.wallet().then((w) => setWallet(w.balance))).catch(() => undefined);
      return v;
    },
    listings,
    placeBid: (id, amount) => setListings((ls) => ls.map((l) => l.id === id ? { ...l, topBid: Math.max(l.topBid ?? 0, amount) } : l)),
    vendorWallet, lockedWarrantyPool,
    bidTokens,
    useBidToken: () => { if (bidTokens <= 0) return false; setBidTokens((t) => t - 1); return true; },
    refundBidToken: () => setBidTokens((t) => t + 1),
    busy, setBusy,
    availableNow,
    setAvailableNow: (v) => { setAvailableNowState(v); api.setAvailability(v, 23.601, 58.401).catch(() => undefined); },
    strikes, addStrike: () => setStrikes((s) => s + 1),
    warrantyClaims,
    resolveClaim: (id, action) => setClaims((cs) => cs.map((c) => c.id === id ? { ...c, status: action === "schedule" ? "scheduled" : "ignored" } : c)),
    skills, addSkill: (name) => { setSkills((s) => [...s, { name, status: "pending" }]); api.requestSkillTag(name).catch(() => undefined); },
    receipts, addReceipt: (store, amount) => setReceipts((rr) => [...rr, { id: `r${rr.length + 1}`, store, amount }]),
    approveParts: () => setPartsApproved(true), partsApproved,
    diagnosticPassActive,
    buyDiagnosticPass: () => { setWallet((w) => Math.max(0, w - 3)); setDiag(true); api.buyDiagnosticPass().then(() => api.wallet().then((w) => setWallet(w.balance))).catch(() => undefined); },
    releaseDiagnosticPass: () => { setDiag(false); setVendorWallet((w) => w + 1); },
  }), [token, userName, authReady, role, walletOMR, bids, activeJobId, lockedBidId, escrowStage, isPlus, isPro, vendorPhoto, consumerPhoto, vouchers, listings, vendorWallet, lockedWarrantyPool, bidTokens, busy, availableNow, strikes, warrantyClaims, skills, receipts, partsApproved, diagnosticPassActive]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
