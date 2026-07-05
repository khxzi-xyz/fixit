/** FixIt Now backend client → live NestJS API. Token in localStorage. */
const BASE = (import.meta as any).env?.VITE_API_URL ?? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000/api`;
const TOKEN_KEY = "fixit_jwt_token";

export const getToken = (): string | null =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
};

export function tokenClaims(): { sub?: string; full_name?: string; role?: string; phone?: string; user_metadata?: any; app_metadata?: any } | null {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = t.split(".")[1];
    const claims = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const meta = claims.user_metadata || {};
    const appMeta = claims.app_metadata || {};
    return {
      ...claims,
      full_name: claims.full_name || meta.full_name || "FixIt User",
      role: claims.role || meta.role || appMeta.role || "CONSUMER",
      phone: claims.phone || meta.phone || null,
    };
  } catch { return null; }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error((json as any).message ?? `${method} ${path} → ${res.status}`);
  return json as T;
}

export interface AuthResult { accessToken: string; user: { user_id: string; full_name: string; role: string } }
export interface Wallet { walletId: string; balance: number; lockedBalance: number; currency: string }
export interface Txn { txn_id: string; kind: string; amount: number; balance_after: number; note?: string | null; created_at: string }

export const api = {
  base: BASE,
  // auth
  me: () => req<any>("GET", "/auth/me"),
  googleLogin: (idToken: string, role: "CONSUMER" | "VENDOR" = "CONSUMER") => req<AuthResult>("POST", "/auth/google", { idToken, role }),
  requestOtp: (phoneNumber: string) => req<{ sent: true }>("POST", "/auth/otp/request", { phoneNumber }),
  verifyOtp: (phoneNumber: string, code: string, fullName: string | undefined, role: "CONSUMER" | "VENDOR") =>
    req<AuthResult>("POST", "/auth/otp/verify", { phoneNumber, code, fullName, role }),
  linkPhone: (phoneNumber: string, code: string) =>
    req<AuthResult>("POST", "/auth/otp/link", { phoneNumber, code }),
  // wallet
  wallet: () => req<Wallet>("GET", "/wallet"),
  walletTxns: () => req<Txn[]>("GET", "/wallet/transactions"),
  topup: (amount: number) => req<{ credited: number; bonus: number; balance: number }>("POST", "/wallet/topup", { amount }),
  requestPayout: (amount: number) => req<unknown>("POST", "/wallet/payouts", { amount }),
  redeemVoucher: (code: string) => req<any>("POST", "/vouchers/redeem", { code }),
  // categories + jobs
  categories: () => req<{ category_id: string; display_name: string; icon_key?: string; framework?: string }[]>("GET", "/categories"),
  createJob: (input: { categoryId: string; urgency: string; description?: string; lat: number; lng: number; postingKind?: string; bountyPrice?: number; aiRewritten?: boolean; originalDescription?: string; mediaUrls?: string[] }) =>
    req<any>("POST", "/jobs", input),
  myJobs: () => req<any[]>("GET", "/jobs/mine"),
  getJob: (jobId: string) => req<any>("GET", `/jobs/${jobId}`),
  feed: () => req<any[]>("GET", "/jobs/feed"),
  vendorMine: () => req<any[]>("GET", "/jobs/vendor-mine"),
  rewriteTicket: (rawText: string, categoryHint?: string) => req<any>("POST", "/ai/rewrite-ticket", { rawText, categoryHint }),
  dictionary: () => req<Record<string, { en: string; ar: string; ur: string }>>("GET", "/translation/dictionary"),
  // bids
  jobBids: (jobId: string) => req<any[]>("GET", `/jobs/${jobId}/bids`),
  selectBid: (jobId: string, bidId: string) => req<any>("POST", `/jobs/${jobId}/bids/${bidId}/select`),
  submitBid: (input: { jobId: string; bidAmount: number; proposedMilestones: { label: string; pct: number }[] }) => req<any>("POST", "/bids", input),
  // warranty / parts / completion
  getWarranty: (jobId: string) => req<any | null>("GET", `/jobs/${jobId}/warranty`),
  proposeWarranty: (jobId: string, days: number) => req<any>("POST", `/jobs/${jobId}/warranty`, { days }),
  counterWarranty: (jobId: string, days: number) => req<any>("POST", `/jobs/${jobId}/warranty/counter`, { days }),
  agreeWarranty: (jobId: string) => req<any>("POST", `/jobs/${jobId}/warranty/agree`, {}),
  listParts: (jobId: string) => req<any[]>("GET", `/jobs/${jobId}/parts-funding`),
  completionStatus: (jobId: string) => req<any>("GET", `/jobs/${jobId}/completion`),
  completionPhotos: (jobId: string) => req<any[]>("GET", `/jobs/${jobId}/completion/photos`),
  trackingSession: (jobId: string) => req<any | null>("GET", `/jobs/${jobId}/tracking`),
  startTracking: (jobId: string) => req<any>("POST", `/jobs/${jobId}/tracking/start`, {}),
  arriveTracking: (jobId: string) => req<any>("POST", `/jobs/${jobId}/tracking/arrive`, {}),
  trackingPing: (jobId: string, lat: number, lng: number) => req<any>("POST", `/jobs/${jobId}/tracking/ping`, { lat, lng }),
  trackingDestination: (jobId: string, lat: number, lng: number) => req<any>("POST", `/jobs/${jobId}/tracking/destination`, { lat, lng }),
  confirmCompletion: (jobId: string, answer: "YES" | "NO", reason?: string) => req<any>("POST", `/jobs/${jobId}/completion/confirm`, { answer, reason }),
  submitReview: (jobId: string, rating: number, body?: string) => req<any>("POST", `/jobs/${jobId}/review`, { rating, body }),
  myReview: (jobId: string) => req<any | null>("GET", `/jobs/${jobId}/review`),
  vendorReviews: (vendorId: string) => req<any[]>("GET", `/vendors/${vendorId}/reviews`),
  uploadImage: (dataUrl: string, folder?: string) => req<{ url: string }>("POST", "/uploads", { dataUrl, folder }),
  uploadPhoto: (jobId: string, phase: string, url: string) => req<any>("POST", `/jobs/${jobId}/completion/photos`, { phase, url }),
  // marketplace / map
  marketListings: () => req<any[]>("GET", "/marketplace/listings"),
  nearbyVendors: (lat: number, lng: number, radius = 20000) => req<any[]>("GET", `/map/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  setAvailability: (isAvailable: boolean, lat?: number, lng?: number) => req<any>("POST", "/availability", { isAvailable, lat, lng }),
  // vendor
  bidTokens: () => req<{ tokens: number }>("GET", "/vendors/bid-tokens"),
  mySkillTags: () => req<any[]>("GET", "/vendors/skill-tags"),
  vendorAnalytics: () => req<any>("GET", "/vendor/analytics"),
  // engagement / billing
  notifications: () => req<any[]>("GET", "/notifications"),
  markNotificationsRead: () => req<any>("POST", "/notifications/read-all", {}),
  addresses: () => req<any[]>("GET", "/addresses"),
  addAddress: (label: string, details?: string, lat?: number, lng?: number) => req<any>("POST", "/addresses", { label, details, lat, lng }),
  deleteAddress: (id: string) => req<any>("DELETE", `/addresses/${id}`),
  supportTickets: () => req<any[]>("GET", "/support/tickets"),
  createSupportTicket: (subject: string, body: string) => req<any>("POST", "/support/tickets", { subject, body }),
  plans: () => req<any[]>("GET", "/plans"),
  billingMe: () => req<any>("GET", "/billing/me"),
  subscribe: (planId: string) => req<any>("POST", "/billing/subscribe", { planId }),
  // kyc
  updateSettings: (dto: { theme?: string; language?: string }) => req("PUT", "/settings", dto),
  uploadAvatar: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/settings/avatar`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message ?? "Upload failed");
    return json as { avatarUrl: string };
  },
  kycUpload: (documentType: string, dataUrl: string) => req<any>("POST", "/vendor/kyc/document", { documentType, dataUrl }),
  kycDocuments: () => req<any[]>("GET", "/vendor/kyc/documents"),
  kycSubmit: () => req<any>("POST", "/vendor/kyc/submit", {}),
  kycQueue: () => req<any[]>("GET", "/admin/kyc"),
  kycReview: (documentId: string, approve: boolean, reason?: string) => req<any>("POST", `/admin/kyc/${documentId}`, { approve, reason }),
  // admin
  adminLogin: (password: string) => req<AuthResult>("POST", "/auth/admin-login", { password }),
  disputes: () => req<any[]>("GET", "/disputes"),
  resolveDispute: (id: string, decision: string) => req<any>("POST", `/disputes/${id}/resolve`, { decision }),
  pendingVerifications: () => req<any[]>("GET", "/wallet/admin/verifications"),
  pendingPayouts: () => req<any[]>("GET", "/wallet/admin/payouts"),
  adminMetrics: () => req<any>("GET", "/admin/metrics"),

  // push
  registerPushNotifications: async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const sw = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Ideally subscribe to push manager and send subscription to backend
        console.log("Push notifications granted.");
      }
    }
  },

  // chat
  getMessages: (jobId: string) => req<any[]>("GET", `/chat/${jobId}`),
  sendMessage: (jobId: string, content: string, mediaUrl?: string) => req<any>("POST", `/chat/${jobId}`, { content, mediaUrl }),
  markMessagesRead: (jobId: string) => req<any>("POST", `/chat/${jobId}/read`, {}),
};
