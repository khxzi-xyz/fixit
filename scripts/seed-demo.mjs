/**
 * Demo seeder -populates the live backend with believable data so every screen
 * has something to show on first load. Idempotent-ish: safe to run repeatedly
 * (it just adds more listings). Talks to the running API, no direct DB access.
 *
 *   node scripts/seed-demo.mjs            # against https://backend.fixit-now.xyz/api
 *   API=http://host:3000/api node scripts/seed-demo.mjs
 */
const BASE = process.env.API ?? "https://backend.fixit-now.xyz/api";

async function call(path, { method = "GET", token, body } = {}) {
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
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${json.message ?? text}`);
  return json;
}

const login = (role) => call("/auth/dev-login", { method: "POST", body: { role } });
const ok = (label) => console.log(`  ✓ ${label}`);
const warn = (label, e) => console.log(`  · skipped ${label} (${e.message?.slice(0, 80)})`);

async function main() {
  console.log(`Seeding demo data → ${BASE}\n`);

  const consumer = await login("CONSUMER");
  const vendor = await login("VENDOR");
  console.log("Logged in consumer + vendor.\n");

  const C = consumer.accessToken;
  const V = vendor.accessToken;

  // --- Vendor goes live on the map (so the Live Map shows a real pin) --------
  try {
    await call("/availability", { method: "POST", token: V, body: { isAvailable: true, lat: 23.601, lng: 58.401 } });
    ok("vendor is Available Now near Muscat");
  } catch (e) { warn("availability", e); }

  // --- Vendor requests a skill tag (so admin Skill queue has a row) ----------
  try {
    await call("/vendors/skill-tags", { method: "POST", token: V, body: { categoryId: "SECURITY", proofUrl: "https://picsum.photos/seed/cctv/400", proofNote: "CCTV install -6 yrs" } });
    ok("vendor skill-tag request (SECURITY)");
  } catch (e) { warn("skill tag", e); }

  // --- Consumer tops up wallet ----------------------------------------------
  try {
    const w = await call("/wallet/topup", { method: "POST", token: C, body: { amount: 50 } });
    ok(`consumer wallet topped up → ${w.balance} OMR`);
  } catch (e) { warn("topup", e); }

  // --- A couple of open jobs + a live bid -----------------------------------
  const jobSpecs = [
    { categoryId: "AC", urgency: "EMERGENCY", description: "Split AC blowing warm air, needs gas refill + service." },
    { categoryId: "PLUMBING", urgency: "THIS_WEEK", description: "Kitchen sink leaking under the cabinet, slow drip." },
  ];
  for (const spec of jobSpecs) {
    try {
      const job = await call("/jobs", { method: "POST", token: C, body: { ...spec, lat: 23.588, lng: 58.3829 } });
      ok(`job posted: ${spec.categoryId}`);
      try {
        await call("/bids", { method: "POST", token: V, body: { jobId: job.job_id, bidAmount: spec.categoryId === "AC" ? 22 : 15, proposedMilestones: [{ label: "Completion", pct: 100 }] } });
        ok(`  vendor bid on ${spec.categoryId} job`);
      } catch (e) { warn("bid", e); }
    } catch (e) { warn(`job ${spec.categoryId}`, e); }
  }

  // --- Marketplace listings (goods) -----------------------------------------
  const goods = [
    { title: "DeWalt cordless drill (used)", saleKind: "FIXED", price: 18.5, description: "Barely used, with 2 batteries." },
    { title: "Office desk + chair", saleKind: "FIXED", price: 35, description: "Solid wood, great condition." },
    { title: "Mountain bike -21 speed", saleKind: "AUCTION", startingBid: 20, auctionHours: 48, description: "Starting low, no reserve." },
  ];
  for (const g of goods) {
    try { await call("/marketplace/listings", { method: "POST", token: C, body: g }); ok(`listing: ${g.title}`); }
    catch (e) { warn(`listing ${g.title}`, e); }
  }

  // --- Junk auction ----------------------------------------------------------
  try {
    await call("/junk/listings", { method: "POST", token: C, body: { title: "Old fridge + scrap copper pipes", photoUrl: "https://picsum.photos/seed/junk/400", lat: 23.59, lng: 58.39 } });
    ok("junk listing posted");
  } catch (e) { warn("junk", e); }

  // --- High-ticket lead-lock -------------------------------------------------
  try {
    await call("/high-ticket/listings", { method: "POST", token: C, body: { title: "2018 Toyota Land Cruiser", itemClass: "VEHICLE", askingPrice: 9700, description: "Single owner, full service history." } });
    ok("high-ticket listing posted");
  } catch (e) { warn("high-ticket", e); }

  // --- Diagnostic pass -------------------------------------------------------
  try {
    await call("/diagnostics/passes", { method: "POST", token: C, body: { categoryId: "AC", description: "Car AC not cold, unsure why." } });
    ok("diagnostic pass purchased");
  } catch (e) { warn("diagnostic pass", e); }

  console.log("\nDone. Refresh the apps to see live data.");
}

main().catch((e) => {
  console.error("\nSeed failed:", e.message);
  process.exit(1);
});
