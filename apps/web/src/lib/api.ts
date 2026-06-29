/**
 * FixIt backend client (REST → NestJS API). Token in localStorage (client only).
 * Configure VITE_API_URL; defaults to the local backend.
 */
const BASE = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000/api";
const TOKEN_KEY = "fixit_token";

export const getToken = (): string | null =>
  typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (typeof window === "undefined") return;
  if (t) window.localStorage.setItem(TOKEN_KEY, t);
  else window.localStorage.removeItem(TOKEN_KEY);
};

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error((json as any).message ?? `${method} ${path} → ${res.status}`);
  return json as T;
}

export interface AuthUser { user_id: string; full_name: string; role: string }
export interface AuthResult { accessToken: string; user: AuthUser }
export interface ApiJob {
  job_id: string; category_id: string; urgency: string; status: string;
  description?: string | null; budget_range_min?: number | null; budget_range_max?: number | null;
  posting_kind?: string; bounty_price?: number | null; created_at: string;
}
export interface ApiBid {
  bid_id: string; job_id: string; vendor_id: string; bid_amount: number;
  proposed_milestones: { label: string; pct: number }[]; status: string; created_at: string;
}
export interface ApiListing {
  listing_id: string; seller_id: string; title: string; description?: string | null;
  sale_kind: "FIXED" | "AUCTION"; price?: number | null; status: string;
}
export interface ApiWallet { walletId: string; balance: number; lockedBalance: number; currency: string }
export interface ApiTxn { txn_id: string; kind: string; amount: number; balance_after: number; note?: string | null; created_at: string }

export const api = {
  base: BASE,
  // Auth
  devLogin: (role: "CONSUMER" | "VENDOR") => req<AuthResult>("POST", "/auth/dev-login", { role }),
  requestOtp: (phoneNumber: string) => req<{ sent: true; devCode?: string }>("POST", "/auth/otp/request", { phoneNumber }),
  verifyOtp: (phoneNumber: string, code: string, fullName: string | undefined, role: "CONSUMER" | "VENDOR") =>
    req<AuthResult>("POST", "/auth/otp/verify", { phoneNumber, code, fullName, role }),

  // Wallet
  wallet: () => req<ApiWallet>("GET", "/wallet"),
  walletTxns: () => req<ApiTxn[]>("GET", "/wallet/transactions"),
  topup: (amount: number) => req<{ credited: number; bonus: number; balance: number }>("POST", "/wallet/topup", { amount }),
  requestPayout: (amount: number) => req<unknown>("POST", "/wallet/payouts", { amount }),

  // Categories + jobs
  categories: () => req<{ category_id: string; display_name: string }[]>("GET", "/categories"),
  createJob: (input: { categoryId: string; urgency: string; description?: string; lat: number; lng: number; postingKind?: string; bountyPrice?: number; aiRewritten?: boolean; originalDescription?: string }) =>
    req<ApiJob>("POST", "/jobs", input),
  myJobs: () => req<ApiJob[]>("GET", "/jobs/mine"),
  feed: () => req<ApiJob[]>("GET", "/jobs/feed"),
  vendorMine: () => req<ApiJob[]>("GET", "/jobs/vendor-mine"),
  rewriteTicket: (rawText: string, categoryHint?: string) =>
    req<{ title: string; ticket: string; categoryGuess: string | null; clarifyingQuestions: string[] }>("POST", "/ai/rewrite-ticket", { rawText, categoryHint }),

  // Bids
  jobBids: (jobId: string) => req<ApiBid[]>("GET", `/jobs/${jobId}/bids`),
  selectBid: (jobId: string, bidId: string) =>
    req<{ bidId: string; status: string; escrow: { funded: boolean; amount: number; source: string } }>("POST", `/jobs/${jobId}/bids/${bidId}/select`),
  submitBid: (input: { jobId: string; bidAmount: number; proposedMilestones: { label: string; pct: number }[] }) =>
    req<ApiBid>("POST", "/bids", input),

  // Warranty / parts / completion
  proposeWarranty: (jobId: string, days: number) => req<unknown>("POST", `/jobs/${jobId}/warranty`, { days }),
  getWarranty: (jobId: string) => req<any | null>("GET", `/jobs/${jobId}/warranty`),
  listParts: (jobId: string) => req<any[]>("GET", `/jobs/${jobId}/parts-funding`),
  approveParts: (requestId: string) => req<unknown>("POST", `/parts-funding/${requestId}/approve`),
  confirmCompletion: (jobId: string, answer: "YES" | "NO") => req<unknown>("POST", `/jobs/${jobId}/completion/confirm`, { answer }),

  // Marketplace / junk / diagnostics
  marketListings: () => req<ApiListing[]>("GET", "/marketplace/listings"),
  createListing: (input: { title: string; saleKind: "FIXED" | "AUCTION"; price?: number; description?: string }) =>
    req<ApiListing>("POST", "/marketplace/listings", input),
  buyNow: (id: string) => req<any>("POST", `/marketplace/listings/${id}/buy`),
  junkListings: () => req<any[]>("GET", "/junk/listings"),
  createJunk: (title: string) => req<any>("POST", "/junk/listings", { title, lat: 23.59, lng: 58.39 }),
  buyDiagnosticPass: (categoryId?: string, description?: string) => req<any>("POST", "/diagnostics/passes", { categoryId, description }),

  // Live map / availability / bounties
  nearbyVendors: (lat: number, lng: number, radius = 20000) =>
    req<any[]>("GET", `/map/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),
  setAvailability: (isAvailable: boolean, lat?: number, lng?: number) => req<unknown>("POST", "/availability", { isAvailable, lat, lng }),
  directBounties: () => req<any[]>("GET", "/direct-bounties"),

  // Vendor skills / tokens
  mySkillTags: () => req<any[]>("GET", "/vendors/skill-tags"),
  requestSkillTag: (categoryId: string, proofUrl?: string) => req<any>("POST", "/vendors/skill-tags", { categoryId, proofUrl }),
  bidTokens: () => req<{ tokens: number }>("GET", "/vendors/bid-tokens"),

  // Uploads (Supabase Storage)
  uploadImage: (dataUrl: string, folder?: string) => req<{ url: string; path: string }>("POST", "/uploads", { dataUrl, folder }),
  uploadPhoto: (jobId: string, phase: "BEFORE" | "VENDOR_AFTER" | "CONSUMER_AFTER", url: string) =>
    req<unknown>("POST", `/jobs/${jobId}/completion/photos`, { phase, url }),

  // Engagement
  notifications: () => req<any[]>("GET", "/notifications"),
  vendorReviews: (vendorId: string) => req<any[]>("GET", `/vendors/${vendorId}/reviews`),

  // Vendor ops (Zone 6)
  vendorAnalytics: () => req<{ series: { month: string; total: number }[]; gross: number; fees: number; payouts: number; jobs: number }>("GET", "/vendor/analytics"),
  team: () => req<any[]>("GET", "/vendor/team"),
  addStaff: (name: string, phone?: string, vehicle?: string) => req<any>("POST", "/vendor/team", { name, phone, vehicle }),
  removeStaff: (id: string) => req<any>("DELETE", `/vendor/team/${id}`),
  myAds: () => req<any[]>("GET", "/vendor/ads"),
  createAd: (headline: string, bannerUrl?: string, targetUrl?: string) => req<any>("POST", "/vendor/ads", { headline, bannerUrl, targetUrl }),
  activeBanners: () => req<any[]>("GET", "/ads/active"),

  // KYC (Zone 1)
  kycDocuments: () => req<any[]>("GET", "/vendor/kyc/documents"),
  kycUpload: (documentType: string, dataUrl: string) => req<any>("POST", "/vendor/kyc/document", { documentType, dataUrl }),
  kycSubmit: () => req<any>("POST", "/vendor/kyc/submit", {}),

  // Address book (Zone 4)
  addresses: () => req<any[]>("GET", "/addresses"),
  addAddress: (label: string, lat?: number, lng?: number, details?: string) => req<any>("POST", "/addresses", { label, lat, lng, details }),
  deleteAddress: (id: string) => req<any>("DELETE", `/addresses/${id}`),

  // Support (Zone 8)
  myTickets: () => req<any[]>("GET", "/support/tickets"),
  createTicket: (subject: string, body?: string) => req<any>("POST", "/support/tickets", { subject, body }),

  // Billing / vouchers
  plans: () => req<any[]>("GET", "/plans"),
  subscribe: (planId: string) => req<any>("POST", "/billing/subscribe", { planId }),
  redeemVoucher: (code: string) => req<any>("POST", "/vouchers/redeem", { code }),
};
