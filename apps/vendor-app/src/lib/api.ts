/** FixIt Now backend client → live NestJS API. Token in localStorage. */
const BASE = (import.meta as any).env?.VITE_API_URL ?? `http://${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:3000/api`;
const TOKEN_KEY = "fixit_jwt_token";

export const getToken = (): string | null =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);

export const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
};

export function tokenClaims(): { sub?: string; full_name?: string; role?: string; phone?: string; email?: string; user_metadata?: any; app_metadata?: any } | null {
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
      email: claims.email || meta.email || null,
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

/** Stale-While-Revalidate (SWR) instant caching engine */
export function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  onData: (data: T) => void
): Promise<T> {
  const cacheKey = `fixit_cache_${key}`;
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached !== null) {
        onData(JSON.parse(cached));
      }
    } catch { /* ignore cache parse error */ }
  }
  return fetcher().then((fresh) => {
    if (typeof window !== "undefined" && fresh !== undefined && fresh !== null) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(fresh));
      } catch { /* storage quota */ }
    }
    onData(fresh);
    return fresh;
  }).catch((err) => {
    // If network fails but cache exists, we still served cached data
    return Promise.reject(err);
  });
}

export interface AuthResult { accessToken: string; user: { user_id: string; full_name: string; role: string } }
export interface Wallet { walletId: string; balance: number; lockedBalance: number; currency: string }
export interface Txn { txn_id: string; kind: string; amount: number; balance_after: number; note?: string | null; created_at: string }
export interface Reward { reward_id: string; user_id: string; balance: number; lifetime_earned: number }
export interface RewardTxn { txn_id: string; kind: string; amount: number; note?: string; created_at: string }
export interface Ad { ad_id: string; title: string; subtitle?: string; image_url?: string; background_color?: string; cta_label: string; cta_url?: string; ad_type: string }

export const api = {
  base: BASE,

  // ── Auth ──────────────────────────────────────────────────────────
  me: () => req<any>("GET", "/auth/me"),
  googleLogin: (idToken: string, role: "CONSUMER" | "VENDOR" = "CONSUMER") => req<AuthResult>("POST", "/auth/google", { idToken, role }),
  requestOtp: (phoneNumber: string) => req<{ sent: true }>("POST", "/auth/otp/request", { phoneNumber }),
  verifyOtp: (phoneNumber: string, code: string, fullName: string | undefined, role: "CONSUMER" | "VENDOR") =>
    req<AuthResult>("POST", "/auth/otp/verify", { phoneNumber, code, fullName, role }),
  linkPhone: (phoneNumber: string, code: string) => req<AuthResult>("POST", "/auth/otp/link", { phoneNumber, code }),

  // ── Wallet ────────────────────────────────────────────────────────
  wallet: () => req<Wallet>("GET", "/wallet"),
  walletTxns: () => req<Txn[]>("GET", "/wallet/transactions"),
  topup: (amount: number) => req<{ credited: number; bonus: number; balance: number }>("POST", "/wallet/topup", { amount }),
  requestPayout: (amount: number) => req<unknown>("POST", "/wallet/payouts", { amount }),
  redeemVoucher: (code: string) => req<any>("POST", "/vouchers/redeem", { code }),
  myVouchers: () => Promise.resolve([
    { code: "FIXIT2026", amount: 5, expiry: "2026-12-31" },
    { code: "WELCOME50", amount: 2, expiry: "2026-08-15" }
  ]),

  // ── Rewards ───────────────────────────────────────────────────────
  myRewards: () => req<Reward>("GET", "/rewards/me"),
  rewardTxns: () => req<RewardTxn[]>("GET", "/rewards/transactions"),
  redeemRewards: (amount: number) => req<any>("POST", "/rewards/redeem", { amount }),
  myReferralCode: () => req<{ code: string; referral_url: string }>("GET", "/rewards/referral-code"),
  referralStats: () => req<{ total_referred: number; pending: number; rewarded: number }>("GET", "/rewards/referral-stats"),
  applyCoupon: (code: string) => req<any>("POST", "/rewards/coupon/apply", { code }),
  availableCoupons: () => req<any[]>("GET", "/rewards/coupons"),

  // ── Categories + Jobs ─────────────────────────────────────────────
  categories: () => req<{ category_id: string; display_name: string; icon_key?: string; framework?: string }[]>("GET", "/categories"),
  createJob: (input: { categoryId: string; urgency: string; description?: string; lat: number; lng: number; postingKind?: string; bountyPrice?: number; aiRewritten?: boolean; originalDescription?: string; mediaUrls?: string[] }) =>
    req<any>("POST", "/jobs", input),
  myJobs: () => req<any[]>("GET", "/jobs/mine"),
  getJob: (jobId: string) => req<any>("GET", `/jobs/${jobId}`),
  feed: () => req<any[]>("GET", "/jobs/feed"),
  vendorMine: () => req<any[]>("GET", "/jobs/vendor-mine"),
  rewriteTicket: (rawText: string, categoryHint?: string) => req<any>("POST", "/ai/rewrite-ticket", { rawText, categoryHint }),
  aiMatchmaker: (text: string) => req<any>("POST", "/ai/matchmaker", { text }),
  dictionary: () => req<Record<string, { en: string; ar: string; ur: string }>>("GET", "/translation/dictionary"),

  // ── Bids ──────────────────────────────────────────────────────────
  jobBids: (jobId: string) => req<any[]>("GET", `/jobs/${jobId}/bids`),
  selectBid: (jobId: string, bidId: string) => req<any>("POST", `/jobs/${jobId}/bids/${bidId}/select`),
  submitBid: (input: { jobId: string; bidAmount: number; proposedMilestones: { label: string; pct: number }[] }) => req<any>("POST", "/bids", input),

  // ── Completion / Warranty ─────────────────────────────────────────
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

  // ── Storage ───────────────────────────────────────────────────────
  uploadImage: (dataUrl: string, folder?: string) => req<{ url: string }>("POST", "/uploads", { dataUrl, folder }),
  uploadPhoto: (jobId: string, phase: string, url: string) => req<any>("POST", `/jobs/${jobId}/completion/photos`, { phase, url }),

  // ── Map / Vendors ─────────────────────────────────────────────────
  marketListings: () => req<any[]>("GET", "/marketplace/listings"),
  nearbyVendors: (lat: number, lng: number, radius = 20000) => req<any[]>("GET", `/map/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  setAvailability: (isAvailable: boolean, lat?: number, lng?: number) => req<any>("POST", "/availability", { isAvailable, lat, lng }),
  publicVendorProfile: (id: string) => req<any>("GET", `/vendors/${id}/public`),
  bidTokens: () => req<{ tokens: number }>("GET", "/vendors/bid-tokens"),
  mySkillTags: () => req<any[]>("GET", "/vendors/skill-tags"),
  vendorAnalytics: () => req<any>("GET", "/vendor/analytics"),

  // ── Ads ───────────────────────────────────────────────────────────
  getAds: (screen?: string) => req<Ad[]>("GET", `/ads${screen ? `?screen=${screen}` : ""}`),
  trackAdClick: (adId: string) => req<any>("POST", `/ads/${adId}/click`, {}),

  // ── Advertise Leads ───────────────────────────────────────────────
  submitAdvertiseLead: (data: { business_name: string; contact_name: string; phone: string; email?: string; ad_type: string; description?: string; budget_omr?: number }) =>
    req<any>("POST", "/advertise/leads", data),

  // ── Notifications ─────────────────────────────────────────────────
  notifications: () => req<any[]>("GET", "/notifications"),
  markNotificationsRead: () => req<any>("POST", "/notifications/read-all", {}),
  markOneRead: (id: string) => req<any>("POST", `/notifications/${id}/read`, {}),
  registerPushNotifications: async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const sw = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          console.log("[FixIt] Push notifications granted");
        }
      } catch (e) {
        console.warn("[FixIt] Push registration failed", e);
      }
    }
  },

  // ── Addresses ─────────────────────────────────────────────────────
  addresses: () => req<any[]>("GET", "/addresses"),
  addAddress: (label: string, details?: string, lat?: number, lng?: number) => req<any>("POST", "/addresses", { label, details, lat, lng }),
  deleteAddress: (id: string) => req<any>("DELETE", `/addresses/${id}`),
  updateAddress: (id: string, label: string, details?: string) => req<any>("PUT", `/addresses/${id}`, { label, details }),

  // ── Support ───────────────────────────────────────────────────────
  supportTickets: () => req<any[]>("GET", "/support/tickets"),
  createSupportTicket: (subject: string, body: string) => req<any>("POST", "/support/tickets", { subject, body }),

  // ── Billing / Plans ───────────────────────────────────────────────
  plans: () => req<any[]>("GET", "/plans"),
  billingMe: () => req<any>("GET", "/billing/me"),
  subscribe: (planId: string) => req<any>("POST", "/billing/subscribe", { planId }),
  startTrial: (refCode?: string) => req<any>("POST", "/billing/trial", refCode ? { refCode } : {}),
  paymentMethods: () => req<any[]>("GET", "/billing/payment-methods"),
  addPaymentMethod: (card: { cardNumber: string; expMonth: number; expYear: number; holderName?: string; cvv?: string }) =>
    req<any>("POST", "/billing/payment-methods", card),
  deletePaymentMethod: (id: string) => req<any>("DELETE", `/billing/payment-methods/${id}`),
  claimReferral: (code: string) => req<any>("POST", "/rewards/referral/claim", { code }),

  // ── AI Support chat ───────────────────────────────────────────────
  supportChatHistory: () => req<any[]>("GET", "/support/chat"),
  supportChatSend: (content: string) => req<{ user: any; reply: any }>("POST", "/support/chat", { content }),
  supportChatEscalate: (summary?: string) => req<any>("POST", "/support/chat/escalate", summary ? { summary } : {}),

  // ── Settings / KYC ───────────────────────────────────────────────
  updateSettings: (dto: { theme?: string; language?: string }) => req("PUT", "/settings", dto),
  updateFcmToken: (token: string) => req<any>("PUT", "/settings/fcm-token", { token }),
  updateProfile: (dto: { full_name?: string; phone?: string }) => req<any>("PUT", "/settings/profile", dto),
  changePassword: (currentPassword: string, newPassword: string) => req<any>("POST", "/settings/change-password", { currentPassword, newPassword }),
  deleteAccount: () => req<any>("DELETE", "/settings/account"),
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

  // ── Admin ─────────────────────────────────────────────────────────
  adminLogin: (password: string) => req<AuthResult>("POST", "/auth/admin-login", { password }),
  kycQueue: () => req<any[]>("GET", "/admin/kyc"),
  kycReview: (documentId: string, approve: boolean, reason?: string) => req<any>("POST", `/admin/kyc/${documentId}`, { approve, reason }),
  disputes: () => req<any[]>("GET", "/disputes"),
  resolveDispute: (id: string, decision: string) => req<any>("POST", `/disputes/${id}/resolve`, { decision }),
  pendingVerifications: () => req<any[]>("GET", "/wallet/admin/verifications"),
  pendingPayouts: () => req<any[]>("GET", "/wallet/admin/payouts"),
  adminMetrics: () => req<any>("GET", "/admin/metrics"),
  adminGetAiProvider: () => req<{ provider: string }>("GET", "/ai/provider"),
  adminSetAiProvider: (provider: "gemini" | "groq") => req<any>("POST", "/ai/provider", { provider }),
  adminTestAi: () => req<any>("GET", "/ai/provider/test"),
  adminGetAds: () => req<any[]>("GET", "/admin/ads"),
  adminCreateAd: (data: any) => req<any>("POST", "/admin/ads", data),
  adminUpdateAd: (id: string, data: any) => req<any>("PUT", `/admin/ads/${id}`, data),
  adminDeleteAd: (id: string) => req<any>("DELETE", `/admin/ads/${id}`),
  adminGetLeads: () => req<any[]>("GET", "/admin/advertise-leads"),
  adminGetSettings: () => req<any[]>("GET", "/admin/settings"),
  adminUpdateSetting: (key: string, value: string) => req<any>("PUT", `/admin/settings/${key}`, { value }),
  adminGetCoupons: () => req<any[]>("GET", "/admin/coupons"),
  adminCreateCoupon: (data: any) => req<any>("POST", "/admin/coupons", data),
  adminDeleteCoupon: (id: string) => req<any>("DELETE", `/admin/coupons/${id}`),
  adminGetReferrals: () => req<any[]>("GET", "/admin/referrals"),

  // ── Chat ──────────────────────────────────────────────────────────
  getMessages: (jobId: string) => req<any[]>("GET", `/chat/${jobId}`),
  sendMessage: (jobId: string, content: string, mediaUrl?: string) => req<any>("POST", `/chat/${jobId}`, { content, mediaUrl }),
  markMessagesRead: (jobId: string) => req<any>("POST", `/chat/${jobId}/read`, {}),

  // ── Big Idea Modules ──────────────────────────────────────────────
  getStoreProducts: (q?: string, cat?: string) => req<any[]>("GET", `/store/products?${q ? `q=${encodeURIComponent(q)}&` : ""}${cat ? `category=${cat}` : ""}`),
  getStoreProduct: (id: string) => req<any>("GET", `/store/products/${id}`),
  placeStoreOrder: (items: any[], address: string) => req<any>("POST", "/store/orders", { items, delivery_address: address }),
  getStoreOrders: () => req<any[]>("GET", "/store/orders/me"),
  triggerEmergency: (type: string, address?: string) => req<any>("POST", "/emergency/dispatch", { type, lat: 23.588, lng: 58.3829, address }),
  getMaintenancePlans: () => req<any[]>("GET", "/maintenance/plans"),
  subscribeMaintenance: (planId: string) => req<any>("POST", "/maintenance/subscribe", { plan_id: planId }),
  getFeed: () => req<any[]>("GET", "/feed"),
  toggleFeedLike: (id: string) => req<any>("POST", `/feed/${id}/like`, {}),
  getFavorites: () => req<any[]>("GET", "/favorites"),
  toggleFavorite: (vendor: any) => req<any>("POST", "/favorites/toggle", vendor),
};
