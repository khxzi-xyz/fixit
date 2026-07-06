const BASE = (process.env.EXPO_PUBLIC_API_URL ?? "https://backend.fixit-now.xyz/api");
let TOKEN: string | null = null;
let USER_ID: string | null = null;

export const setToken = (t: string | null) => { TOKEN = t; };
export const getToken = () => TOKEN;
export const setUserId = (id: string | null) => { USER_ID = id; };
export const getUserId = () => USER_ID;

export interface FeedJob {
  job_id: string;
  category_id: string;
  urgency: string;
  description?: string | null;
  budget_range_min?: number | null;
  budget_range_max?: number | null;
  created_at: string;
}
export interface VendorProfile {
  vendor_id: string;
  category_ids: string[];
  verification_status: string;
  subscription_status: string;
  rating_avg: number;
  jobs_completed_count: number;
}
export interface MyJob {
  job_id: string;
  category_id: string;
  status: string;
  description?: string | null;
}
export interface WarrantyTerms {
  job_id: string;
  proposed_by_user_id: string;
  proposed_days: number;
  countered_days?: number | null;
  agreed_days?: number | null;
  status: "PROPOSED" | "COUNTERED" | "AGREED";
}
export interface PayoutSchedule {
  job_id: string;
  total_amount: number;
  vendor_immediate_amount: number;
  vendor_halfway_amount: number;
  vendor_final_amount: number;
  immediate_released_at?: string | null;
  halfway_released_at?: string | null;
  final_released_at?: string | null;
  status: string;
}
export interface PartsFundingRequest {
  request_id: string;
  job_id: string;
  description: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "DECLINED" | "INSTALLED";
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

let mockJobs: FeedJob[] = [
  {
    job_id: "j_1",
    category_id: "AC",
    urgency: "EMERGENCY",
    description: "My Daikin AC is blowing warm air. Need someone immediately.",
    created_at: new Date().toISOString(),
  },
  {
    job_id: "j_2",
    category_id: "PLUMBING",
    urgency: "THIS_WEEK",
    description: "Kitchen sink pipe leaking under cabinet.",
    created_at: new Date().toISOString(),
  },
];

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(json.message ?? `API ${res.status}`);
  return json as T;
}
const post = (path: string, body?: unknown) => req(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
const get = (path: string) => req(path);

export const api = {
  devLogin: async () => {
    try {
      return await req<{ accessToken: string; user: { full_name: string } }>("/auth/dev-login", {
        method: "POST",
        body: JSON.stringify({ role: "VENDOR" }),
      });
    } catch {
      await delay(400);
      return { accessToken: "mock-vendor-token", user: { full_name: "Khalid Al Balushi" } };
    }
  },
  me: async (): Promise<VendorProfile> => {
    await delay(200);
    return {
      vendor_id: "v_1",
      category_ids: ["AC", "PLUMBING"],
      verification_status: "VERIFIED",
      subscription_status: "ACTIVE",
      rating_avg: 4.8,
      jobs_completed_count: 142,
    };
  },
  feed: async (): Promise<FeedJob[]> => {
    try {
      return await req<FeedJob[]>("/jobs/feed");
    } catch {
      await delay(300);
      return mockJobs;
    }
  },
  submitBid: async (input: { jobId: string; bidAmount: number; proposedMilestones: { label: string; pct: number }[] }) => {
    try {
      return await req(`/bids`, { method: "POST", body: JSON.stringify(input) });
    } catch {
      await delay(400);
      mockJobs = mockJobs.filter((j) => j.job_id !== input.jobId);
      return { bid_id: `b_${Date.now()}` };
    }
  },
  myJobs: async (): Promise<MyJob[]> => {
    try {
      return await req<MyJob[]>("/jobs/vendor-mine");
    } catch {
      return [];
    }
  },
  getWarranty: (jobId: string) => req<WarrantyTerms | null>(`/jobs/${jobId}/warranty`),
  proposeWarranty: (jobId: string, days: number) =>
    req<WarrantyTerms>(`/jobs/${jobId}/warranty`, { method: "POST", body: JSON.stringify({ days }) }),
  agreeWarranty: (jobId: string) => req<WarrantyTerms>(`/jobs/${jobId}/warranty/agree`, { method: "POST" }),
  getPayoutSchedule: (jobId: string) => req<PayoutSchedule | null>(`/jobs/${jobId}/warranty/payout`),
  requestParts: (jobId: string, description: string, amount: number) =>
    req<PartsFundingRequest>(`/jobs/${jobId}/parts-funding`, { method: "POST", body: JSON.stringify({ description, amount }) }),
  listParts: (jobId: string) => req<PartsFundingRequest[]>(`/jobs/${jobId}/parts-funding`),
  markPartsInstalled: (requestId: string, photoUrl: string, serial: string) =>
    req<PartsFundingRequest>(`/parts-funding/${requestId}/installed`, {
      method: "POST",
      body: JSON.stringify({ photoUrl, serial }),
    }),

  // --- Wallet / earnings (Module 04) ---
  wallet: () => req<WalletBalance>("/wallet"),
  walletTxns: () => req<WalletTxn[]>("/wallet/transactions"),
  payouts: () => req<PayoutRequest[]>("/wallet/payouts"),
  requestPayout: (amount: number, bankAccountName?: string, bankAccountRef?: string) =>
    req<PayoutRequest>("/wallet/payouts", { method: "POST", body: JSON.stringify({ amount, bankAccountName, bankAccountRef }) }),

  // --- Availability / Live map (Module 09) ---
  setAvailability: (isAvailable: boolean, lat?: number, lng?: number) =>
    req<unknown>("/availability", { method: "POST", body: JSON.stringify({ isAvailable, lat, lng }) }),
  updateLocation: (lat: number, lng: number) =>
    req<unknown>("/availability/location", { method: "POST", body: JSON.stringify({ lat, lng }) }),
  startTracking: (jobId: string) => req<unknown>(`/jobs/${jobId}/tracking/start`, { method: "POST" }),
  arrive: (jobId: string) => req<unknown>(`/jobs/${jobId}/tracking/arrive`, { method: "POST" }),

  // --- Direct bounties (Module 09) ---
  directBounties: () => req<DirectBounty[]>("/direct-bounties"),
  respondBounty: (bountyId: string, action: "ACCEPT" | "DECLINE" | "COUNTER", counterPrice?: number) =>
    req<unknown>(`/direct-bounties/${bountyId}/respond`, { method: "POST", body: JSON.stringify({ action, counterPrice }) }),

  // --- Bid-back tokens (Module 03) ---
  bidTokens: () => req<{ tokens: number }>("/vendors/bid-tokens"),

  // --- Skill tags (Module 02) ---
  mySkillTags: () => req<SkillTag[]>("/vendors/skill-tags"),
  requestSkillTag: (categoryId: string, proofUrl?: string, proofNote?: string) =>
    req<SkillTag>("/vendors/skill-tags", { method: "POST", body: JSON.stringify({ categoryId, proofUrl, proofNote }) }),

  // --- Bounty bargain (Module 03) ---
  makeBountyOffer: (jobId: string, move: "ACCEPT" | "COUNTER", price?: number) =>
    req<unknown>(`/jobs/${jobId}/bounty-offers`, { method: "POST", body: JSON.stringify({ move, price }) }),

  // --- Triple-Verify completion (Module 06) ---
  uploadPhoto: (jobId: string, phase: "BEFORE" | "VENDOR_AFTER" | "CONSUMER_AFTER", url: string) =>
    req<unknown>(`/jobs/${jobId}/completion/photos`, { method: "POST", body: JSON.stringify({ phase, url }) }),
  completionStatus: (jobId: string) => req<unknown>(`/jobs/${jobId}/completion`),

  // --- Settings (theme) ---
  getSettings: () => get("/settings") as Promise<{ theme?: string } | null>,
  saveSettings: (s: { theme?: string }) => req("/settings", { method: "PUT", body: JSON.stringify(s) }),

  // --- Uploads ---
  uploadImage: (dataUrl: string, folder?: string) => post("/uploads", { dataUrl, folder }) as Promise<{ url: string; path: string }>,

  // --- Chat ---
  chatList: (jobId: string) => get(`/jobs/${jobId}/chat`) as Promise<any[]>,
  chatSend: (jobId: string, body: string) => post(`/jobs/${jobId}/chat`, { body }),
  chatSendVoice: (jobId: string, mediaUrl: string, durationSecs?: number) =>
    post(`/jobs/${jobId}/chat/media`, { type: "VOICE", mediaUrl, durationSecs }),

  // --- Billing (Pro/Elite) ---
  plans: () => get("/plans") as Promise<any[]>,
  myPlan: () => get("/billing/me") as Promise<{ plan_id?: string | null } | null>,
  subscribe: (planId: string) => post("/billing/subscribe", { planId }),

  // --- Vendor module actions ---
  // Junk (Module 22): browse + bid + (seller) accept/pickup
  junkListings: () => get("/junk/listings") as Promise<any[]>,
  bidJunk: (junkId: string, amount: number, pickupEta?: string) => post(`/junk/listings/${junkId}/bid`, { amount, pickupEta }),
  // Diagnostics (Module 18): log a visit outcome
  diagnosticVisit: (passId: string, outcome: "CANNOT_DIAGNOSE" | "DIAGNOSED", note?: string) =>
    post(`/diagnostics/passes/${passId}/visit`, { outcome, note }),
  // High-ticket (Module 20): browse
  highTicketListings: () => get("/high-ticket/listings") as Promise<any[]>,
  // Marketplace browse
  marketListings: () => get("/marketplace/listings") as Promise<any[]>,
};

export interface WalletBalance {
  walletId: string;
  balance: number;
  lockedBalance: number;
  currency: string;
}
export interface WalletTxn {
  txn_id: string;
  kind: string;
  amount: number;
  balance_after: number;
  note?: string | null;
  created_at: string;
}
export interface PayoutRequest {
  payout_id: string;
  amount: number;
  status: string;
  requested_at: string;
}
export interface DirectBounty {
  bounty_id: string;
  consumer_id: string;
  offered_price: number;
  counter_price?: number | null;
  category_id?: string | null;
  note?: string | null;
  status: string;
}
export interface SkillTag {
  tag_id: string;
  category_id: string;
  status: string;
  proof_url?: string | null;
}
