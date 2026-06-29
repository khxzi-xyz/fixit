# FixIt Marketplace - Ideas, Modules, and App Structure

## 1. Pivot: Liability & Insurance Disclaimer Strategy
Based on recent decisions, the platform will **not** provide or integrate third-party liability insurance. We act strictly as a matchmaking and escrow platform.
- **Implementation**: A 1-time "Terms of Service & Liability Disclaimer" popup will appear on the first app launch for both Consumers and Vendors. 
- **Popup Content Summary**: "FixIt connects you with independent service providers. We do not employ the vendors, nor do we provide insurance or guarantee the safety/quality of work. Any property damage or disputes over physical work must be resolved directly with the vendor. By proceeding, you agree that FixIt is not liable for vendor negligence."
- **Escrow Impact**: The `ESCALATED_INSURANCE_CLAIM` escrow state is removed. Disputes will only be resolved via Escrow Refunds/Releases.

---

## 2. Complete App Structures (IN DETAIL)

### A. Consumer Mobile App (React Native/Expo)
1. **Onboarding & Auth Module**
   - Splash Screen -> 1-Time Liability Disclaimer Popup (Mandatory Accept)
   - OTP Login (Phone Number) / Google / Apple Sign-In
   - Address Setup (GPS Location access permission, Map Pin drop)
2. **Home Dashboard**
   - **Header**: User profile pic, location selector.
   - **Quick Actions**: Grid of top categories (AC, Plumbing, Electrical, Handyman, Cleaning).
   - **Active Jobs Banner**: Shows current status of ongoing jobs (e.g., "Vendor En Route").
   - **Recent Activity**: Past jobs with "Rebook" buttons.
3. **Job Creation Flow (The Wizard)**
   - **Step 1 (Category)**: Pick main trade.
   - **Step 2 (Sub-Issue)**: e.g., "Not cooling", "Leaking", "Strange noise".
   - **Step 3 (Details)**: Text description (AI Scanned) & Media upload (Photos/Videos).
   - **Step 4 (Logistics)**: Urgency (Emergency vs Flexible), budget range.
   - **Step 5 (Review)**: Confirm address on map and publish.
4. **Bidding & Q&A Feed**
   - View incoming bids (Price, Vendor Rating, Distance).
   - Read/Reply to Q&A thread (Vendors asking for clarification).
   - Accept Bid -> Navigates to Escrow Funding.
5. **Job Execution & Escrow Tracker**
   - **Funding Screen**: Stripe/PayPal UI to lock funds in holding.
   - **Tracker UI**: Progress bar (Vendor Confirmed -> En Route -> In Progress -> Complete).
   - **Comms Hub**: In-app chat and Masked Calling (unlocks *only* after funding).
   - **Milestone Approval**: Tap to approve vendor work and release funds.
6. **Profile & Settings**
   - Wallet/Payment Methods.
   - Support & Dispute Ticket Creation.

### B. Vendor Mobile App (React Native/Expo)
1. **Onboarding & Verification Module**
   - Splash Screen -> 1-Time Liability Disclaimer Popup (Mandatory Accept).
   - Auth & ID Upload (Trade License, National ID).
   - Category Selection & Service Radius Configuration.
2. **Job Discovery Radar (Dashboard)**
   - Map View / List View of Open Jobs nearby.
   - Profit Margin Estimator on each card.
   - Filters (Distance, Urgency, Category).
3. **Bidding Engine**
   - Tap Job -> View details & photos.
   - "Ask Details" button (posts to public Q&A).
   - "Submit Bid" form: Enter price, select milestone split (e.g., 50% start, 50% finish), estimated ETA.
4. **Active Jobs & Execution**
   - Status Updater: "Start Journey", "Arrived", "Milestone 1 Done".
   - Upload proof-of-work photos.
5. **Earnings & Wallet**
   - Dashboard of Pending Escrow, Released Funds, and Withdrawn.
   - Payout request button.
6. **Vendor Profile**
   - Public facing stats: Rating, Jobs Completed, Reviews.

### C. Admin Command Center (Next.js Web)
1. **Triage Queue**
   - Unified dashboard for AI Flags, Payment Disputes, and Support Tickets.
2. **Dispute Resolution Flow**
   - Side-by-side view: Consumer Claim vs Vendor Response + Escrow Ledger.
   - 1-Click Action buttons: Refund Consumer, Release to Vendor, 80/20 Split.
3. **AI Flag Review Desk**
   - Split view: Original Text vs AI-Sanitized Text.
   - Actions: Approve Sanitized, Reject, Manual Edit.
4. **Vendor Management**
   - Approve/Reject vendor verification documents.
   - Suspend accounts.

---

## 3. Feature Modules & Innovation Ideas

* **Deterministic AI Disintermediation**: Real-time scanning of all text for phone numbers, "whatsapp" obfuscations, or social media handles. Flips jobs to `PENDING_REVIEW` instantly.
* **Escrow Math Engine (80/20 Rule)**: Hardcoded logic that ensures the platform *always* takes its fixed commission out of the escrow pool before refunding consumers or paying vendors during disputes.
* **Sealed Bidding**: Vendors cannot see what other vendors are bidding. This prevents the "race to the bottom" and forces honest pricing based on vendor margins.
* **Masked Telephony**: Integrate Twilio proxy numbers so users can call each other without seeing real phone numbers. This prevents post-job direct contracting.
* **One-Tap "Re-use Last Bid"**: Vendors who do repetitive jobs (e.g., standard AC cleaning for 15 OMR) can submit a bid in a single click.
* **Offline-Tolerant Vendor App**: Vendors often work in basements with bad signal. Cache active job details locally so they can read requirements and queue status updates offline.

### Extended Feature Modules & Innovations
* **BNPL Escrow Integration (Buy Now, Pay Later)**: Integrate with regional BNPL providers (like Tabby or Tamara). Consumers can finance major repairs (e.g., 500 OMR whole-house rewiring) over 4 months, but the vendor still receives full payout immediately upon milestone completion.
* **AI Cost & Margin Estimator**: When consumers select tags and upload photos, an AI runs historical analysis to propose a "Fair Market Range", preventing absurdly low budget expectations. Vendors see a "Margin Calculator" taking their travel distance and base rate into account against the bid.
* **AR Diagnostic & Measurement Tool**: Consumers can use Augmented Reality (AR) through their phone camera to measure spaces (e.g., room size for BTU AC calculation) or highlight broken components. This gives vendors perfect context and eliminates 80% of "need to see it first" physical site visits.
* **Real-Time Auto-Translation Engine**: With the diverse GCC demographic, consumers and vendors often speak different primary languages (Arabic, English, Hindi, Malayalam). In-app chat and Q&A threads are instantly translated to the user's device language setting, ensuring perfect communication.
* **B2B Parts Supply Chain Integration**: Vendors can browse a catalog of common parts (capacitors, pipes, wiring) from local B2B suppliers directly within their app. They can click "Order to Site" and have the supplier deliver the part directly to the consumer's address while the vendor is working.
* **Vendor Micro-Credentials & Gamification**: Vendors can complete in-app digital assessments or upload specific manufacturer certifications (e.g., "Certified Daikin Installer") to earn profile badges. Badged vendors can command up to 15% higher bid acceptance rates.
* **Smart "Retainer" Contracts**: Consumers who love a vendor's work can upgrade a one-off job to a "Yearly Maintenance Contract" (e.g., quarterly AC servicing). Escrow automatically locks the quarterly payment and routes the job card straight to that specific vendor without public bidding.
* **Dynamic Surge Pricing Indicator**: During heatwaves (AC breakdown spikes) or heavy rains (roof leak spikes), the platform algorithmically detects demand surges in a geolocation and advises consumers that higher bids may be required to secure an available vendor.

---

## 4. Competitor Analysis & Feature Inspiration

Based on a web search of top home-service marketplace apps (TaskRabbit, Urban Company, Thumbtack), FixIt Marketplace can integrate the best of their models:

### A. TaskRabbit (Direct Selection & Same-Day)
* **What they do well**: Real-time availability, direct chat, and "Happiness Pledge".
* **Feature to steal**: **Same-Day Emergency Badges**. Vendors who guarantee arrival within 2 hours get a priority highlight in the bid list. Consumers can toggle an "I need help RIGHT NOW" switch that restricts bidding to available rapid-response vendors only.

### B. Urban Company (Standardized, Full-Stack Service)
* **What they do well**: Fixed pricing, high professional standards, trained providers.
* **Feature to steal**: **Standardized "Common Jobs" Menu**. While FixIt is bid-based, we can offer "Fixed-Price Quick Books" for extremely common tasks (e.g., "Standard AC Cleaning - 15 OMR"). Vendors can opt-in to automatically accept these fixed-price jobs without the friction of bidding.

### C. Thumbtack (Quote-Based Projects)
* **What they do well**: Lead generation, complex projects (renovations), "Home Profile" tracker.
* **Feature to steal**: **The "Home Profile" Hub**. Let consumers create profiles for their homes (e.g., "2-Bedroom Apartment", "4 AC Units (Carrier)", "Built in 2018"). This context is automatically attached to their Job Cards, saving them from re-typing their home setup for every new repair and helping vendors bid more accurately.

### Refined "Super App" Flow Integration
By combining these, FixIt's core flow evolves to:
1. **The Choice**: Consumer selects a category (AC Repair).
2. **Standard vs Custom**: App asks: "Standard Cleaning (Fixed 15 OMR)" or "Custom Repair (Get Quotes)".
3. **Smart Context**: App pulls from the consumer's "Home Profile" (e.g., 3-Ton Daikin AC) automatically.
4. **The Bid Feed**: If custom, vendors bid. If Emergency is toggled, only "Rapid Response" badged vendors can accept.
5. **The Guarantee**: The liability disclaimer is clear that we don't ensure work, but the **Escrow Tracker** ensures no one pays for an uncompleted job.
