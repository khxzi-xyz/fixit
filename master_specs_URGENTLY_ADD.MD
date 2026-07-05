Contents
1. Executive Summary 02
2. System Architecture Map 03
3. Job Posting & AI Layer 04
4. Dynamic Service Catalog 05
5. The Bidding Engine 06
6. Escrow & The Dual-Wallet System 07
7. On-Site Parts Protocol 08
8. Triple-Verify Completion 09
9. Peer-to-Peer Warranty System 10
10. Trust, Privacy & Anti-Poach 11
11. Monetization: Plus & Pro Tiers 12
12. Risk Matrix & Platform Killers 13
13. Launch Roadmap 14
14. Final Word 15
FixIt One Internal Specification Draft v1.0
B E TA B U I L D S P E C I F I C AT I O N · I N T E R N A L D O C U M E N T
FixIt One
Master Specification
A decentralized, privacy-first, hyper-local peer-to-peer marketplace for on-demand
physical labor (Khidmah). This document consolidates every system, mechanic, and
decision finalized to date into one buildable specification.
E X E C U T I V E S U M M A RY What FixIt One is, and what makes it different
FixIt One is a hyper-local, reverse-auction marketplace for physical, on-demand labor: plumbing, electrical, AC
repair, transport, and any other service a verified local provider can perform in person. It is not a digital-gig
platform and not a generic classifieds app. It is built around one core idea: the platform holds the money,
the platform holds the trust, and neither side has a reason to leave.
The five pillars this build is designed around
1
Full escrow lock, not partial
100% of the agreed labor fee (Khidmah) is paid into escrow before work starts, and stays locked through the entire
agreed warranty period, not just until the job is marked done.
2 Vendor-given, peer-negotiated warranty
The platform never invents or imposes a warranty term. The vendor offers a duration, the consumer can counter, and
only a mutual agreement binds to the order.
3
Zero contact before full payment
No phone numbers, addresses, or open chat threads are exchanged until the consumer's payment is fully confirmed
and locked, removing the financial incentive to bypass the platform.
4
Labor-first bidding, parts handled on-site
All bidding covers labor only (Khidmah). Parts are priced and agreed upon live, on location, through one of three
flexible protocols, never guessed at during bidding.
5
Any service, not just trades
The catalog is dynamic. If a service category doesn't exist yet, anyone can request it, and admin approval extends
the entire marketplace to a new vertical within 24 to 48 hours.
Not Fiverr
This is a physical-world reverse auction with money held in escrow, not a digital marketplace for
freelance gigs. The trust mechanics in this document exist because someone is entering a
stranger's home, not delivering a file.
What this document covers
Every module below reflects a finalized decision, including the mechanics that were proposed, debated, and explicitly
rejected along the way (insurance-based protection, group/public job posting, emergency-only bidding windows, and
toolbox-inventory profile checks were all considered and cut; see the relevant module for why). What remains is the build
target for the beta.
FixIt One · Master Specification Page 2 of 15
A R C H I T E C T U R E The complete system map, end to end
Every module in this document is a zoom-in on one stage of this pipeline. Read this once, then use it as the
index for everything that follows.
[User Posts Issue] --> [Optional AI Rewrite Engine] --> [Internal AI Price Estimate (admin-only)]
 │
 ▼
 [Dynamic Service Catalog Match]
 ┌──────────────┴──────────────┐
 Service Exists Not Found
 │ │
 ▼ ▼
 [Alert Tagged, Approved Vendors] [Request Custom Service] --> [Admin Reviews, 24-48h] --> [Catalog Updated,
Network Pinged]
 │
 ▼
 [Blind Bidding or Bounty Bargain]
 ┌──────────────┴──────────────┐
 Standard Job Bounty Job
 Vendors blind-bid Khidmah User sets fixed price,
 (can't see other bids) vendors accept or counter
 │ │
 └──────────────┬──────────────┘
 ▼
 [User Selects Vendor / Price Locked]
 │
 ▼
 [User Pays 100% Khidmah --> Admin Manually Verifies --> Escrow Lock]
 │
 ▼
 [Vendor Status --> "Busy", Blocked From Other Bids]
 │
 ▼
 [Privacy-Locked Tracking Activates ONLY on "On My Way"]
 │
 ▼
 [On-Site Parts Protocol]
 ┌───────────────────────┼───────────────────────┐
 A: Multi-Receipt B: Escort Mode C: No Parts
 Vendor buys, logs User shops with Labor-only,
 receipts per store vendor, pays shop skip straight
 to verification
 │
 ▼
 [Triple-Verify: Vendor "After" Photo + User "After" Photo]
 │
 ▼
 [Job Marked Done]
 │
 ▼
 [User Confirms: Job Done?]
 ┌──────────────┴──────────────┐
YES NO
 │ │
 ▼ ▼
 [Full Khidmah Held Through [Dispute: Photos Reviewed]
 Agreed Warranty Period] │
 │ Vendor flaked --> Refund to user
 ▼ User lied --> Funds to vendor
 [Warranty Clears Clean]
 │
 ▼
 [80% Released to Vendor Wallet / 20% to FixIt One]
 │
 ▼
 [Verified Review Unlocked] (only after full escrow clears)
One Rule
Nothing financial happens outside this pipeline. No side payments, no pre-payment chat, no
warranty the platform invents on its own. Every branch above ends in either a locked agreement
or a returned dollar, never an ambiguous state.
FixIt One · Master Specification Page 3 of 15
MODULE 01
J O B P O S T I N G From a blurry photo to a clear, biddable job
Most posting friction comes from users who can't describe their own problem well. A user who writes
"water leaking fix pls" with one dark photo gets bad bids. This module exists to fix that before it ever
reaches a vendor.
Core posting flow
1 Media upload, tiered by plan
Free tier: up to 3 images and 1 video. FixIt One Plus: up to 10 images and 3 to 5 videos. Limits exist to manage storage
cost, not to punish free users.
2
The AI Rewrite button
One tap analyzes the uploaded photo and the user's rough description, asks one or two clarifying questions if
needed (for example, "Is this a PVC pipe?"), and rewrites the post into a clear, professional job ticket a vendor can
actually price.
3
Bilingual by design, no forced translation
The AI Rewrite adapts to both sides' app language settings. It is not a translation layer bolted onto chat; it
understands colloquial slang in Arabic, Urdu, Hindi, or English and converts it into a clean technical request natively.
4
Usage caps by tier
Free: 5 standard AI rewrites per month. FixIt One Plus: 20 bilingual AI uses per week. Caps exist to keep inference cost
predictable while making the paid tier clearly worth it.
The internal AI price estimator (admin and system only, never shown to users)
A background model reads the post's text and photos and calculates an estimated fair market range for that job (for
example, a pipe fix landing between 15 and 25 OMR). This number is never shown to the consumer. It exists purely to
protect the marketplace:
TRIGGER SYSTEM BEHAVIOR
Vendor bids far below the
estimated floor
Bid is flagged or automatically blocked, depending on how far below the admin-set
threshold it falls. This stops a vendor from bidding 1 OMR purely to disrupt a competitor's
market.
Job post has no clear category
match
Flagged for the AI to suggest the closest existing service, or routed to the "Request
Custom Service" flow (Module 2).
Post content looks like spam or
market sabotage
Flagged for manual admin review before it reaches the public feed.
Considered and parked: A full public-facing price suggestion shown to users was discussed and intentionally avoided for the
beta. Showing a visible "fair price" number to consumers risks anchoring every bid toward that number and killing the genuine
competitive bidding dynamic the platform depends on. The estimate stays internal only.
FixIt One · Master Specification Page 4 of 15
MODULE 02
S E R V I C E C ATA L O G FixIt One is not a trades app. It's an any-service app.
A plumber, an electrician, and a taxi driver are all just verified providers of a service. The catalog has to
grow with demand instead of being hardcoded to a handful of trade categories at launch.
The "Request to Add Service" loop
1 Not found in the dropdown? Request it
If a user searches "Taxi" or "AC Gas Refill" and nothing matches, they see "Service Not Found. Tap to Request," fill in
a short form, and submit.
2
Admin reviews within 24 to 48 hours
An admin manually adds the new category to the master catalog. This stays a manual gate at this stage of the build,
same as payment verification, to keep early catalog quality controlled.
3 Network-wide notification on approval
The moment a service is added, every relevant user and vendor gets a push notification: "New Service Unlocked:
you can now book or offer [Service Name]." This turns catalog growth into a visible, recurring engagement moment.
Multi-skill vendor tagging, with quality guardrails
A vendor isn't locked to one trade. A plumber who also handles basic AC repair can select both. But adding any skill tag
requires proof:
STEP DETAIL
Vendor selects an additional skill They upload a photo of past relevant work, or a certificate, tied to that specific skill
tag.
Admin reviews the submission Approval is per-skill, not blanket. A vendor can be approved for plumbing and
pending for AC repair simultaneously.
Job visibility is filtered by approved tags
only
Vendors only see job posts matching skills they've actually been cleared for, which
stops unqualified bidding before it starts.
Why It
Matters
Without this gate, an unqualified vendor could bid low on a job they can't actually do well, just to
win it and figure it out on-site. The skill-tag approval system is what keeps "any service" from
becoming "any random person."
Rejected: A separate "Toolbox Inventory" checklist where vendors self-report owned tools (torch, threader, drain auger, etc.) was
proposed and cut. It added profile complexity without a clear enforcement mechanism, since self-reported tool ownership can't
be verified the way a work photo or certificate can.
FixIt One · Master Specification Page 5 of 15
MODULE 03
B I D D I N G E N G I N E Blind bids for standard jobs, direct bargaining for bounties
Two distinct paths exist depending on how the user wants to hire. Both stay entirely inside the app's ledger.
No phone numbers, no chat, no negotiation happens outside a logged, trackable record.
Path A: Standard Blind Bidding
Vendors submit a labor-only price (Khidmah) without
seeing what anyone else has bid. This prevents a race-tothe-bottom collusion dynamic where vendors undercut
each other repeatedly in real time.
No standard 24-hour or emergency-specific bidding
window. Jobs simply stay open until the user picks a bid
or cancels.
If a user gets zero or weak bids, they can cancel and
instantly repost. The job is bumped fresh to the top of the
local feed with a new notification round.
A separate "emergency bidding" mode was considered
and intentionally dropped: the cancel-and-repost flow
already covers urgency without adding a second, more
complex bidding mode to maintain.
Path B: Bounty Bargain
The user names a fixed price upfront instead of waiting for
bids. Vendors either accept that price instantly or counterbargain with a different number.
All bargaining happens through structured in-app price
actions, never open chat. Every counter-offer is logged
against the order ID.
First qualified, tag-approved vendor to accept the price
(or have their counter accepted) wins the job instantly, no
further comparison needed.
This path is for users who want speed over comparison
shopping, without needing a separate "emergency"
system.
Rules that apply to both paths
RULE WHY IT EXISTS
No chat before payment Removes every opportunity for a side deal to form before the platform has been paid.
This is the single biggest anti-disintermediation control in the entire system.
Single-job lock on acceptance The moment a vendor's bid is accepted, their account flips to "Busy" and they are
blocked from bidding on or viewing other jobs, unless their shop profile has multiple
registered staff or vehicles.
Bid floor protection The internal AI price estimator (Module 1) silently blocks or flags bids that fall
suspiciously below market rate for that job type.
Bid-Back
Tokens
Free vendors get a limited number of bids per day. If a bid is fairly rejected, or the customer
simply picks someone else, the token is returned. A token is only consumed permanently if the
vendor wins the job or ghosts after winning it. This makes the free tier feel fair, which makes the
Pro upgrade (unlimited bids) feel like a real, deserved upgrade rather than a forced paywall.
•
•
•
•
•
•
FixIt One · Master Specification Page 6 of 15
MODULE 04
E S C R O W & WA L L E T S Where the money actually sits, and who can touch it
FixIt One runs on two separate wallets and one manual verification gate. This keeps transaction fees low and
gives the platform full control over fraud and dispute scenarios before money ever leaves the system.
The consumer top-up scale
Designed to reward bigger upfront commitments with a compounding bonus, which improves platform liquidity and reduces
the number of small, repeated transactions:
TOP-UP AMOUNT CREDITED AMOUNT BONUS
10 11 +1
20 23 +3
30 35 +5
40 45 +5
50 55 +5
Pattern: bonus scales up to a flat +5 ceiling at the 30 to 50 tier, keeping the incentive meaningful without the bonus growing
unsustainably at higher amounts.
The vendor accumulation ledger
1
Earnings land in an internal wallet, not an instant payout
Repeated small payouts through a payment processor burn money on transaction fees. Vendors accumulate earnings
inside the app instead.
2
Payout windows, not instant withdrawal
Vendors request a cash-out to their bank account on fixed platform windows, for example twice a week. They can
also choose to let the balance simply stack up in the wallet untouched.
3
The full amount stays locked, never partially split
If a 100 OMR job has a warranty active, the full 100 OMR stays frozen in escrow, not 95 with 5 retained as a platform
fee. The platform's 20% cut is only realized once the warranty period clears cleanly.
Manual admin verification gate
Bank transfers and certain gateway payments (PayPal or local equivalents) cannot be trusted automatically yet, so a manual
check sits in between every payment and the live bidding feed:
STEP DETAIL
User submits a transfer They upload a screenshot of the receipt or transfer confirmation directly in the app.
Job enters "Awaiting Admin
Verification"
It is held out of the public bidding feed entirely until verified, so no vendor can be
matched to unconfirmed funds.
Admin confirms against the real
ledger
One click moves the job to "Active / Open for Bids" once the admin matches the transfer
to the actual bank or PayPal balance.
FixIt One · Master Specification Page 7 of 15
MODULE 05
PA R T S P R O T O C O L Bidding covers labor. Parts get sorted out on-site, fairly.
No bid ever guesses at parts pricing. Every job starts as a Khidmah-only (labor-only) quote. If materials are
actually needed, the vendor and consumer choose one of three protocols once the vendor has physically
inspected the problem.
Option A: Multi-Receipt Log
For jobs needing materials from more than one supplier. The vendor buys what's needed, then logs every purchase
individually inside the order.
STEP DETAIL
Vendor purchases parts Possibly from multiple shops, for example pipes from one supplier and valves from
another.
Vendor logs each receipt
separately
Tapping "+" lets them snap a photo of each individual store receipt and enter that store's
exact amount. Unlimited receipts can be added per job.
App compiles a master billing sheet All logged receipts sum automatically into one combined total for the consumer to review.
Consumer approves the total A single "Approve Parts Charge" action confirms the combined cost before the job
proceeds.
Option B: Escort Mode
For consumers who specifically don't trust a vendor to buy parts on their behalf, or want full control over part quality and
price.
User toggles "I Will Buy Parts Myself" when posting the job.
The vendor inspects the issue on-site, writes a specific shopping list, and physically accompanies the consumer to the
local shop.
The consumer pays the shop directly. No parts money ever touches the app, the vendor's wallet, or the platform's escrow.
Option C: No Parts Required
For tune-ups, diagnostics, or labor-only fixes (resetting a tripped switch, tightening a fitting). The job proceeds straight to
verification under the original Khidmah quote, with no parts step at all.
Why Three
Modes
Different jobs and different consumers need different levels of control. Locking the platform into a
single parts model would either overcomplicate simple jobs or underserve consumers who
specifically don't trust markup pricing. Three clean options cover essentially every real scenario
without adding a fourth.
•
•
•
FixIt One · Master Specification Page 8 of 15
MODULE 06
C O M P L E T I O N Triple-Verify: making "he said, she said" impossible
The single biggest fraud risk in any job-completion system is a dishonest "yes" or "no" from either side.
Triple-Verify removes the ambiguity by requiring visual proof from both parties before any payout logic
runs.
The three-step verification
1 Vendor uploads an "After" photo
Taken through the in-app camera (not a gallery upload, to discourage reusing old photos), this unlocks the jobcompletion request and sends a confirmation prompt to the consumer.
2
Consumer uploads their own "After" photo
The consumer takes their own photo of the same area to confirm what the vendor claims is done. This is a deliberate
double-check, not a rubber stamp.
3
System compares both submissions against the "Before" photo
If the vendor's and consumer's "After" photos clearly match each other and show visible change from the "Before"
photo, there is effectively no room left for either side to dispute in bad faith.
The final confirmation question
[System pings Consumer]: "Is the Job Done?"
YES --> 80% released to Vendor Wallet / 20% to FixIt One Cut
 Triggers the agreed Peer-to-Peer Warranty Lock (Module 07)
NO --> Escrow freeze, Dispute Mode triggered
 FixIt One reviews submitted Before/After photos from both sides
 Vendor flaked or did poor work --> Refund to user
 User is lying despite clear photo evidence --> Funds released to vendor
Communication during the job: raw voice notes, WhatsApp-style
On-site work moves fast, and typing isn't always practical for a vendor mid-repair or a homeowner managing a mess. Voice
notes are supported exactly like WhatsApp: instant record, instant send, no processing delay, and deliberately no automatic
translation layer applied to them. They are for quick back-and-forth during active jobs, not for cross-language negotiation,
which is handled separately by the AI Rewrite engine before the job ever starts.
Considered and rejected: Automatic real-time voice translation (mirroring the text chat's bilingual bridge) was proposed for voice
notes specifically and explicitly turned down. Voice notes are meant to stay raw and immediate, the way two people on a job site
would actually talk.
FixIt One · Master Specification Page 9 of 15
MODULE 07
WA R R A N T Y SYS T E M The vendor gives the warranty. The platform just
enforces it.
FixIt One does not sell insurance and does not impose a fixed warranty period. The platform isn't a service
provider and states this clearly in its terms of service. What it does instead is let two parties agree to their
own warranty, then hold the full payment hostage to make sure that agreement is honored.
How a custom warranty gets set
STEP DETAIL
Vendor proposes a term During bidding or live negotiation, for example: "I offer a 15-day warranty for this patch
job."
Consumer can counter For example: "Make it 30 days and I accept." Negotiation happens the same way price
negotiation does, fully logged.
Both parties click "Agree on Terms" Only once both sides explicitly accept does the warranty duration bind to that specific
order ID.
Zero-day warranties are valid If both sides agree to no warranty at all, that's a legitimate outcome. FixIt One does not force a
minimum.
No
Imposed
Rules
If both parties want a 0-day warranty, that's what they get. If they want 6 months, that's what
they get. The platform simply enforces whatever the two parties actually agreed to.
The full escrow lock during the warranty window
This is the mechanism that makes the warranty mean something, instead of being just a verbal promise.
1
100% of the job value stays frozen, not 80%
If a job is worth 100 OMR, the full 100 OMR remains locked in escrow for the entire agreed warranty period. The
platform never releases its 20% cut early, and the vendor never receives their 80% early either.
2
If the vendor ghosts a valid warranty claim
The vendor has a fixed response window (for example 24 hours) to schedule a re-fix once a warranty claim is raised.
If they ignore it, their wallet is frozen, and the locked 100 OMR is used to dispatch a new, verified vendor to fix the
issue at no extra cost to the consumer. The original vendor receives 0 OMR.
3
The strike system
Each ignored warranty claim counts as a strike against the vendor's account. Three strikes results in a permanent
ban, including their phone number, device ID, and submitted business documentation, closing the loophole of simply
re-registering under a new account.
4
Escalation compensation, not cash refunds
If a warranty issue escalates beyond a simple re-fix, the consumer is compensated with platform credits or coupons
toward their next order, rather than a cash payout. This keeps the resolution inside the FixIt One ecosystem instead of
draining the escrow pool.
Rejected: A "Platform Insurance" model (FixIt One insuring jobs up to a fixed cash amount, for example $5,000 against property
damage) was proposed and explicitly cut. A cash-payout insurance model creates a moral hazard: a consumer has a financial
incentive to claim or even cause damage once they know a verified break unlocks a guaranteed payout. The vendor-given
warranty model removes that incentive entirely, since there's no cash to game, only a free re-fix or platform credit.
FixIt One · Master Specification Page 10 of 15
MODULE 08
T R U S T & P R I VA C Y Why neither side has a real reason to leave the app
Every disintermediation-prevention mechanic in this system works because it removes the incentive to
leave, rather than trying to police behavior after the fact.
Privacy-first location tracking
RULE DETAIL
No passive tracking, ever A vendor's location is never broadcast in the background. There is no always-on GPS
visibility for either party.
Tracking activates only on "On My
Way"
The moment a vendor accepts a locked, fully-paid job and taps "On My Way," live
tracking turns on for that specific job only.
Tracking ends on arrival The moment the vendor taps "Arrived at Location," the tracking session terminates
completely. No lingering location data is kept active.
Contact masking until full payment
Phone numbers, exact addresses, and any direct contact channel stay fully masked until the consumer's 100% Khidmah
payment is confirmed and locked in escrow by the admin. This single rule is the platform's strongest defense against
vendors being poached before a job even starts.
Why staying inside the app is the rational choice, for both sides
For the Consumer
If they save a vendor's number and book directly next time,
they lose the warranty enforcement entirely. If that vendor
does sloppy work or disappears, FixIt One has no leverage to
send a replacement for free. The platform holding the
money is what makes the warranty real; a private phone
number can't enforce anything.
For the Vendor
Cutting the platform out to save a 20% fee risks a
permanent ban across phone number, device ID, and
business documents, cutting off access to every future job
on the platform. Saving a small fee once doesn't outweigh
losing a constant stream of new local clients permanently.
Single-Job
Lock
Once a vendor's bid is accepted, they are immediately marked "Busy" and blocked from viewing
or bidding on any other job, unless their registered shop profile has additional staff or vehicles on
file. This keeps every active job fully staffed and prevents a vendor from over-committing across
multiple consumers at once.
Rejected: Public or "Group" job posts, where multiple neighbors link similar requests together for a bulk discount, were proposed
and rejected outright. The entire platform is built around private, individual, peer-to-peer transactions, closer to a blockchainstyle closed ledger than a public marketplace feed. Group visibility breaks that privacy model.
FixIt One · Master Specification Page 11 of 15
MODULE 09
M O N E T I Z AT I O N Plus for consumers, Pro for vendors, both paying directly
The 20% take-rate on closed jobs is the core revenue engine. These tiers exist to add a second, recurring
revenue layer on top, by giving both sides a reason to pay for more than the basic free experience.
FixIt One Plus (Consumers)
Media allowance: Up to 10 images and 3 to 5 videos
per post, versus 3 images and 1 video on free.
AI engine access: 20 bilingual AI rewrite uses per
week, versus 5 standard rewrites a month on free.
Random coupon drops: Periodic platform-subsidized
discounts and reduced-price bid windows dropped
exclusively to Plus members.
Verified Customer badge: Signals to vendors that
this client has funds ready and pays without friction,
often resulting in faster, better bids.
Direct vendor visibility: Plus members can see a Pro
vendor's full shop profile, including phone and shop
location, before committing to a job.
FixIt One Pro (Vendors)
Featured Bids: Pro vendors can pin their bid to the
top of the customer's job page with a highlighted
border, getting seen first.
Unlimited bidding: No daily bid cap, versus a limited
number of bid-back tokens per day on the free tier.
Rich shop profile: A full digital storefront with bio,
shop photos, and a portfolio of past completed jobs.
The Blue Tick: A Verified Seller badge granted only
after admin checks ID and business documentation,
visible to both sides as a trust signal.
Reviews on every job: All vendors, Pro or free,
receive reviews after every completed job, but Pro's
storefront surfaces them more prominently to drive
conversion.
The "Available Now" Bat-Signal
A live toggle, separate from the subscription tiers, that turns routine availability into an actual growth feature rather than a
flat on/off switch.
MECHANIC DETAIL
Vendor flips "Available Now" Their icon appears as a pulsing marker on the consumer-facing local map in real time, but
only while actively toggled on, never as passive background tracking.
Consumer sees nearby available
vendors
If several vendors are showing as available nearby, panic drops because the consumer
can see help is genuinely close.
Direct Strike-Bounty The consumer can tap a specific available vendor and send a direct bounty offer straight
to them, skipping the full bidding cycle entirely for fast, clear-cut jobs.
Reviews =
Trust
Reviews can only be submitted after a transaction has fully cleared the escrow pipeline. This
single rule eliminates fake five-star bot reviews entirely, since a review requires real money
having actually moved through the platform first.
•
•
•
•
•
•
•
•
•
•
FixIt One · Master Specification Page 12 of 15
MODULE 10
R I S K M AT R I X The three platform killers, and what stops each one
Marketplace apps don't usually fail because of bad code. They fail because of fraud loops, supply gaps, or
trust collapse. Every mechanic in this document maps back to one of these three risks.
A. Disintermediation: going around the app
RISK MITIGATION ALREADY BUILT IN
Vendor and consumer exchange
contact info to skip the 20% fee
Contact masking until full payment (Module 08), no chat before payment, single-job lock,
and permanent ban risk (phone, device ID, business docs) for vendors caught cutting the
platform out.
Repeat business moves offline after
the first job
The vendor-given warranty (Module 07) only applies to jobs booked and paid through the
app. Going direct next time means losing all warranty enforcement leverage.
B. The No-Show / Ghosting Crisis
RISK MITIGATION ALREADY BUILT IN
Vendor accepts a job, then flakes
or never shows
The job stays in escrow regardless. The single-job lock plus warranty strike system
penalizes no-shows directly, and the consumer can cancel and instantly repost to a fresh
vendor pool.
Vendor ghosts a valid warranty
claim
Fixed response window (Module 07), wallet freeze on ignored claims, locked funds used
to dispatch a replacement vendor at no extra cost to the consumer, three strikes results in
a permanent ban.
C. Supply vs. Demand: the cold-start problem
RISK MITIGATION ALREADY BUILT IN
Users post jobs, get zero bids,
delete the app
Launch restricted to a single zip code or neighborhood first (see Roadmap, Phase 2), with
manual vendor recruitment before any consumer marketing begins.
Catalog too narrow to capture real
local demand
The dynamic "Request to Add Service" loop (Module 02) lets the market itself drive
category expansion instead of guessing categories upfront.
Fraud loops specifically closed by design
1
The fake "Job Not Done" refund scam
Closed by Triple-Verify (Module 06). A consumer cannot credibly claim a job wasn't done when both their own and
the vendor's "After" photos clearly show completed work matched against the "Before" photo.
2
The self-inflicted damage insurance scam
Closed by removing cash-payout insurance entirely (Module 07). There is no financial upside to breaking something
on purpose when the only outcome is a free re-fix or platform credit, never cash.
3
The market-sabotage low-bid scam
Closed by the internal AI price-floor guard (Module 01). A vendor bidding 1 OMR purely to disrupt the local market
gets flagged or blocked before the bid ever reaches a consumer.
Payment
Friction
Card processors typically take roughly 2.9% plus a small fixed fee per transaction, plus separate
payout fees going out. The effective net margin on the 20% headline take-rate is realistically
closer to 15 to 16% once processing costs are factored in. This is already accounted for in the
dual-wallet design, which batches vendor payouts to minimize the number of fee-incurring
transactions.
FixIt One · Master Specification Page 13 of 15
ROADMAP
T H E P L A N Three phases from zero to a live, monetized marketplace
Admin tooling and a dedicated vendor-side app are deliberately scoped out of this initial build phase. The
priority right now is proving the core consumer-vendor transaction loop works end to end, manually if
needed, before investing in operator-facing tooling.
PHASE 1
WEEKS 1 TO 4
Core System Architecture & Ledger Setup
Build the database layout for private user accounts, vendor profiles, and encrypted order IDs. Build the dualwallet ledger supporting consumer top-ups and vendor payout requests. Implement the blind bidding and
bounty-bargain logic alongside the locked escrow state machine.
PHASE 2
WEEKS 5 TO 8
Closed Local System Alpha
Physically walk local workshops and supplier stores to onboard the first 20 to 30 reliable vendors in a single
neighborhood or zip code, before any consumer-facing marketing begins. Run live end-to-end tests of the
manual admin verification gate for both bank transfers and card payments. Deploy the Multi-Receipt and
Escort Mode parts flows alongside Triple-Verify to confirm operational stability under real conditions.
PHASE 3
WEEK 9 ONWARD
Marketplace Expansion & Monetization
Unlock FixIt One Plus and FixIt One Pro tiers, including Featured Bids and the Blue Tick verification process. Enable the
dynamic "Request to Add Service" catalog so the market itself drives category expansion. Deploy the
background AI price-floor guard at scale to protect market health as bidding volume grows.
What's intentionally not in this build yet
These are acknowledged, planned, and deliberately sequenced after the core loop is validated, not forgotten:
A dedicated Admin Panel interface (manual verification will run through a basic internal tool first).
A separate, fully-built Vendor-side app experience (vendor flows will run inside the same app initially).
OCR-based automatic receipt scanning for the admin verification queue.
Multi-staff or multi-vehicle shop profile logic for vendors who want to bypass the single-job lock.
•
•
•
•
FixIt One · Master Specification Page 14 of 15
F I N A L W O R D What makes this defensible in a low-competition market
Low competition is an opening, not a guarantee. The mechanics in this document exist because trust, not
features, is what actually wins a market like this one. Every module above was chosen specifically because
it removes an incentive to cheat, rather than adding a rule to punish cheating after it happens.
Summary of what's deliberately not built into the beta
REJECTED CONCEPT WHY IT WAS CUT
Platform-funded cash insurance Creates a moral hazard where consumers can profit from staged or self-inflicted
damage claims.
Public or "Group" job posts Breaks the private, peer-to-peer model the entire trust architecture depends on.
Emergency-only bidding windows The cancel-and-repost flow already solves urgency without a second bidding mode
to maintain.
Toolbox Inventory self-reported checklist Unverifiable self-reporting with no real enforcement mechanism.
Automatic voice note translation Voice notes are meant to stay raw and immediate, not run through a translation
layer.
Visible public price estimates Risks anchoring every bid to a single number, killing genuine price competition.
The Real
Moat
Anyone can copy a bidding UI. What's hard to copy is twenty onboarded vendors who trust the
platform with their warranty enforcement, and consumers who trust it with their money. That trust
is built one cleanly resolved dispute at a time, starting in Phase 2.
Next decisions to make
Two items remain open for the next working session, once this core specification is locked: the exact admin panel layout
for manual payment verification, and the vendor storefront rules for multi-staff Pro accounts. Everything else in this
document is considered final for the beta build.
FixIt One · Master Specification Page 15 of 15
Contents
1. Executive Summary 02
2. Loophole 1: Escrow vs. Milestones 03
3. Loophole 2: Parts Protocol Fraud 04
4. Loophole 3: Triple-Verify Blind Spots 05
5. Loophole 4: Credit Liability Drain 06
6. Loophole 5: The Manual Gate Bottleneck 07
7. Loophole 6: The Plus/Pro Contact Leak 08
8. Fix 1: The Rolling Warranty Payout 09
9. Fix 2: In-App Parts Funding 10
10. Fix 3: Verification, Kept Strict 11
11. Fix 4: Masking That Actually Holds 12
12. Module 18: Workshop Diagnostics 13
13. Module 19: The Open Marketplace 14
14. Module 20: High-Ticket Lead-Lock 15
15. Module 21: Voucher Economy 16
16. Module 22: Reverse Junk Auctions 17
17. The Dynamic Fee-Drop Scale 18
18. Subscription Tiers, Revisited 19
19. Unit Economics & Monthly Budget 20
20. Updated Roadmap 21
21. Final Word 22
FixIt One Internal Specification Revision v2.0
I N T E R N A L A U D I T & R E V I S I O N B L U E P R I N T
FixIt One
Audit, Fixes, and the Next Five Modules
A brutally honest look at where the Beta Build Specification breaks under real-world
pressure, the fixes that actually got decided on, and the new modules that take FixIt One from
a service marketplace into a full local trading platform.
E X E C U T I V E S U M M A RY The Master Specification looked complete. It wasn't.
An external review of the v1.0 Master Specification surfaced six structural loopholes serious enough to
either bleed the platform's cash or kill user trust within the first few months of operation. None of them are
cosmetic. All six trace back to the same root cause: rules that work perfectly on paper but break the moment
real money, real impatience, or real bad actors touch them.
The six loopholes, in one line each
NO. LOOPHOLE THE CORE PROBLEM
1 Escrow vs. Milestones The spec promised a full 30-day escrow lock and instant milestone payouts
in two different documents. Both cannot be true at once.
2 Parts Protocol Fraud Receipts can be faked, and "Escort Mode" puts the vendor and consumer
alone together with zero app oversight, which is exactly where an offline deal
happens.
3 Triple-Verify Blind Spots A photo of a sealed AC unit or buried pipe proves nothing about whether the
actual repair worked.
4 Credit Liability Drain Compensating failed jobs with platform credits quietly becomes a cash
liability the moment that credit gets spent on a new vendor.
5 The Manual Gate Bottleneck An admin manually checking bank screenshots is incompatible with "my pipe
burst right now."
6 The Plus/Pro Contact Leak Giving paying consumers a vendor's phone number defeats the platform's
own anti-poach design.
Bottom
Line
Every one of these loopholes was a place where the platform's own rules contradicted each
other, or where a rule looked airtight until you imagined an actual person trying to get around it.
Fixing them isn't about adding more rules. It's about making sure the existing rules can't fight
each other.
What this document does
Pages 3 to 8 lay out each loophole plainly: what was promised, why it breaks, and what it actually costs. Pages 9 to 12
cover the fixes that were actually decided on, not every fix that was proposed. Several aggressive proposals (automated
third-party arbitration, B2B supplier API integrations, open-banking payment rails) were considered and intentionally left
out of this revision because they assume infrastructure and partnerships the platform doesn't have yet. What's kept is what
can actually be built and trusted at beta scale.
Pages 13 onward cover genuinely new ground: turning FixIt One from a services-only app into a platform that also handles
diagnostics-first repairs, peer-to-peer goods sales, high-ticket items like cars, and scrap and junk resale, all without
repeating the mistakes found in the first six loopholes.
FixIt One · Audit & Fix Blueprint Page 2 of 22
LOOPHOLE 01
E S C R O W V S .
M I L E S T O N E S
Two documents made two payout promises that cannot
both be true
The Master Specification states that 100% of the labor fee stays locked through the entire warranty period,
with the vendor's 80% only released once that warranty clears. A separate trust overview promised vendors
automatic milestone payouts at Arrival, Progress, and Completion. Both cannot be the actual system at once.
Why this breaks in practice
1
If the full lock is real
A vendor finishes a job and then waits 15 to 30 days to see a single cent. Blue-collar workers living week to week
cannot operate that way. The best vendors leave for a competitor, or worse, just stop using the app and go back to
direct, offline word-of-mouth work.
2
If the milestone payouts are real
The vendor already has their money in hand by the time a warranty issue would even surface. If they ghost a valid
warranty claim, FixIt One has nothing left to claw back from them, and has to pay a second vendor entirely out of pocket
to finish the job properly.
The loss, either way: Following the full-lock version costs vendor trust and adoption. Following the milestone version
costs FixIt One real cash every time a vendor ghosts after being paid. There is no version of "do both" that doesn't eventually
break.
Where this shows up in the original system map
[Job Marked Done] --> [User Confirms: Job Done?]
 │
YES --> [Full Khidmah Held Through Warranty Period] <-- Doc 1's promise
 │
 ▼
 [80% Released After Warranty Clears]
 Meanwhile, a separate document told vendors:
 "Payouts release as milestones are approved" (Arrival / Progress / Completion) <-- Doc 2's promise
 These two statements describe two different escrow engines. Only one can be built.
Why It
Matters
This isn't a wording inconsistency to quietly fix in copy. It's a fork in the actual database schema
and state machine. The fix chosen for this (page 9) has to pick one real mechanism and make
every other document in the system match it.
FixIt One · Audit & Fix Blueprint Page 3 of 22
LOOPHOLE 02
PA R T S P R O T O C O L
F R A U D
The two parts options both leak revenue and invite
collusion
Both Option A and Option B exist specifically to keep the app out of the way while parts get sorted on-site.
That's exactly what makes them exploitable.
Option A: Multi-Receipt Log
THE LOOPHOLE THE MECHANISM
Receipts are trivially forgeable A vendor and a friendly local shop can print a receipt for 50 OMR on parts that actually
cost 20 OMR, and split the 30 OMR difference in cash. Nothing in the app can tell a real
receipt from a favor.
Labor gets deliberately underbid A vendor bids 5 OMR labor to win the job cheaply, knowing they'll make their real margin
by inflating the parts bill afterward, which never passes through FixIt One's 20% cut at all.
Option B: Escort Mode
The moment a vendor and a consumer physically walk into a shop together, the app has no eyes on the conversation at all.
[At the hardware shop, vendor turns to consumer]:
 "Instead of paying the remaining 40 OMR labor through the app and waiting
 weeks for the warranty to clear, just hand the shop owner 30 OMR cash now.
 He passes it to me, you save 10 OMR, we cancel the app job."
 Result: FixIt One's cut on this job just went to 0 OMR.
The loss: Every job that goes through Escort Mode or a heavily parts-loaded receipt is a job where the platform's actual
revenue share could be near zero, even though the job shows as "completed" in the system.
The
Pattern
Both loopholes exist because the platform asks the vendor and consumer to step outside the
app's visibility "just for this one part," and that exact moment is where every disintermediation
risk in this document concentrates. Anything that takes a transaction physically outside the app,
even briefly, needs its own guardrail.
FixIt One · Audit & Fix Blueprint Page 4 of 22
LOOPHOLE 03
T R I P L E - V E R I F Y B L I N D S P O T S A photo cannot prove an AC is blowing cold air
Triple-Verify works well for visually obvious jobs: a painted wall, a replaced fixture, a cleaned surface. It
quietly fails for anything where the fix is internal, mechanical, or buried.
Example: AC Compressor Repair
The "Before" photo shows a white AC unit. The "After"
photo shows the exact same white AC unit. Nothing in either
image proves the compressor was actually fixed, the wiring
is safe, or the unit is blowing cold air rather than warm.
Example: Underground Pipe Leak
The plumber fixes the leak and covers it back up with soil or
concrete. The "After" photo is just concrete, identical
whether the repair worked or not. If the pipe bursts again
two hours later, the photo evidence still looks perfect.
The loss: Every job where photos genuinely can't prove the outcome becomes a guaranteed "he said, she said" dispute.
At any real volume, a manual review team drowns in exactly these cases, and every wrong call either burns a good
vendor's trust or eats a real consumer's money.
What stays, what changes
DECISION WHY
Photo and proof-of-work
requirements stay mandatory
This was confirmed, not walked back. Removing the requirement to show visible proof of
work would make every dispute harder to resolve, not easier.
The proposed automated "Master
Vendor" arbitration bounty was
rejected
Routing disputes to a random nearby vendor for a quick 2 OMR payout introduces a new
trust problem instead of solving the old one: that vendor has no real accountability for
getting the call right, and could just as easily collude with whichever side they know
personally.
Disputes stay with internal review
for now
Slower, but accountable. A formal, faster dispute process is a real future need, just not one
solved by outsourcing judgment to a stranger for pocket change.
FixIt One · Audit & Fix Blueprint Page 5 of 22
LOOPHOLE 04
C R E D I T L I A B I L I T Y D R A I N A platform credit is a promise to pay real cash later
The original spec compensates escalated warranty failures with platform credits or coupons instead of cash
refunds. That sounds harmless. It isn't, because that credit has to be honored eventually, and honoring it
costs real money.
[Rogue vendor does bad electrical work, appliance is damaged, vendor vanishes]
 │
 ▼
 [FixIt One issues the consumer a platform credit]
 │
 ▼
 [Consumer books a new job with a completely different, blameless vendor]
 │
 ▼
 [That new vendor expects real payment, not a credit. FixIt One must cover it
 out of actual operating cash, even though this vendor did nothing wrong]
The loss: A platform credit is not free to issue. It's a deferred cash liability sitting on the books. A single bad vendor can
trigger a chain of credits that eventually have to be paid out in real money to vendors who had nothing to do with the
original failure. At scale, this is exactly the kind of liability that quietly bankrupts a marketplace's working capital.
The proposed "insurance levy" fix, and why it's parked for now
One proposed fix was a micro-premium insurance levy: deduct a small percentage from every transaction to fund a real,
licensed third-party insurance pool, so catastrophic failures get settled by an actual insurer instead of FixIt One's own cash.
WHY IT'S NOT IN THIS REVISION DETAIL
FixIt One is not, and does not want to be,
an insurance provider
This is already stated clearly in the platform's own terms of service. Standing up even a
thin insurance layer means a real underwriting partner, not a feature toggle.
It's a Phase 3+ problem, not a beta
problem
At beta volume, the actual dollar exposure from warranty escalations is small enough to
absorb directly. The fix that matters right now is reducing how often this scenario happens
at all, which the rolling warranty payout (page 9) does directly.
FixIt One · Audit & Fix Blueprint Page 6 of 22
LOOPHOLE 05
T H E M A N U A L G AT E B O T T L E N E C K Nobody with a burst pipe waits 24 hours for an
admin
Every top-up and bank transfer in the original spec requires a human admin to manually check an uploaded
screenshot against a real bank ledger before the job goes live. That's a reasonable fraud control. It's also a
direct contradiction of the entire "on-demand, hyper-local" pitch.
11 PM
Test
A user with a flooding kitchen at 11 PM on a Friday cannot wait two to twenty-four hours for an
administrator to log into a banking app and confirm a screenshot. By the time that confirmation
comes through, they've already called a local technician directly and uninstalled the app.
Why this matters more than it looks
This isn't just a slow feature. It's a direct trade-off between two things the platform needs simultaneously: trustworthy
payment verification, and genuine emergency-speed usability. The original spec solved for the first and silently gave up the
second.
WHAT'S REALISTIC FOR BETA WHY
Card payments stay automated
where the gateway supports it
Any payment rail that already gives an instant authorization response (a standard card
charge, for example) should never be routed through a manual admin check. That defeats
the point of having a gateway at all.
Manual bank transfer verification
stays, but only as a fallback
For markets or users where card payment isn't realistic yet, manual transfer review
remains, clearly labeled as slower, with the job genuinely hidden from bidding until
confirmed.
Full automated open-banking
integration is a Phase 3 item
Wiring in a real local instant-payment rail is a partnership and compliance project, not a
beta feature. It's on the roadmap (page 21), not promised before it's actually buildable.
The loss if this isn't addressed: Every emergency-category job is exactly the job most likely to abandon the app the
moment a delay shows up. Losing the emergency use case loses the exact users most likely to become repeat, highvalue customers.
FixIt One · Audit & Fix Blueprint Page 7 of 22
LOOPHOLE 06
T H E P L U S / P R O C O N TA C T
L E A K
Paying 3 OMR to unlock the exact thing the app is
supposed to hide
The original FixIt One Plus tier promised direct vendor visibility, including the vendor's phone number and shop
location, before any booking happened. This directly contradicts the platform's own core anti-poach rule:
zero contact before full payment.
[Consumer pays 3 OMR/month for FixIt One Plus]
 │
 ▼
 [Plus tier unlocks phone numbers + shop locations for nearby Pro vendors]
 │
 ▼
 [Consumer calls the best-rated vendor directly, off-platform]
 │
 ▼
 [A 100 OMR job happens entirely outside the app. FixIt One earned 3 OMR total
 instead of a 20 OMR cut, on every major job this consumer ever books again]
The loss: A single Plus subscriber who figures this out doesn't just cost FixIt One one job's commission. They cost every
future job's commission, because once they have a trusted vendor's direct number, they have no reason to ever open
the app again for that trade.
Why this loophole is more dangerous than the others
The other loopholes are exploited by accident or opportunism. This one is a feature, working exactly as designed, that
happens to be the one feature the entire trust architecture was built to prevent. It's the clearest example in the whole spec of
a paid tier accidentally undoing the platform's own core defense.
FixIt One · Audit & Fix Blueprint Page 8 of 22
FIX 01
T H E R O L L I N G WA R R A N T Y
PAYO U T
One real escrow engine, vendors stay liquid,
warranty still has teeth
This replaces both conflicting promises from Loophole 1 with a single mechanism. The vendor gets most of
their money fast enough to stay liquid. A meaningful slice stays on the hook until the warranty actually
clears, so there's still a real financial reason to honor a warranty claim instead of ghosting it.
The split, on a 100 OMR job with a 30-day warranty
LEDGER CLASS AMOUNT RELEASE TIMING
FixIt One Platform Cut 20 OMR Held the entire warranty period. Released to FixIt One only once the
warranty clears clean.
Vendor Immediate Payout 60 OMR Released as soon as Triple-Verify confirms the job is complete.
This is what keeps the vendor liquid to cover groceries, fuel,
and the next job's costs.
Vendor Halfway Retention 10 OMR Released at the halfway point of the warranty window (Day 15
of 30). Requires no open warranty claim at that point.
Vendor Final Retention 10 OMR Released only when the full warranty period clears with no
unresolved claim (Day 30).
Day 0 (Job Verified Complete) --> Vendor receives 60 OMR instantly
Day 15 (Warranty Halfway, No Claim) --> Vendor receives 10 OMR
Day 30 (Warranty Clears Clean) --> Vendor receives 10 OMR / FixIt One receives 20 OMR
If vendor ghosts a valid claim raised on Day 10:
 --> Vendor forfeits the remaining 20 OMR (the 10+10 still held)
 --> Forfeited amount funds a replacement vendor to finish the job properly
 --> Vendor's account takes a strike; three strikes is a permanent ban
Why It
Works
The vendor never waits weeks to eat. They get the majority of their money the same day the job
is verified. But there's still 20 OMR of their own money sitting on the table for the entire warranty
window, which is exactly the leverage that makes the warranty mean something instead of being
a polite suggestion.
What this replaces: Neither the "full 100% lock for 30 days" promise nor the "instant milestone payout at Arrival,
Progress, Completion" promise survives as originally written. Both get replaced by this single schedule, and every other
document referencing payout timing should be corrected to match it.
FixIt One · Audit & Fix Blueprint Page 9 of 22
FIX 02
I N - A P P PA R T S
F U N D I N G
No QR codes, no supplier integrations. Just keep the
money inside the app.
A more complex fix was proposed involving B2B supplier API integrations and in-store QR scanning. That
assumes partnerships and POS integrations that don't exist yet, and adds real engineering weight to a beta
build. The actual fix is simpler: the vendor never needs to leave the app to request parts money, and the
consumer never needs to hand over cash on-site.
How it actually works
[Vendor diagnoses the issue on-site]:
 "We need a new compressor. It costs 40 OMR at the local shop."
 │
 ▼
 [Vendor opens the FixIt One app, types "Compressor - 40 OMR",
 taps "Request Parts Funding"]
 │
 ▼
 [Consumer gets a notification: "Approve 40 OMR for parts?"]
 │
Approve Decline
 │ │
 ▼ ▼
 [40 OMR charged to consumer's [Vendor and consumer renegotiate,
 wallet, held in app escrow] or job proceeds without that part]
 │
 ▼
 [Vendor buys the part, then uploads a clear photo of the part installed
 in the machine, with the serial number visible, before the completion
 milestone can unlock]
Why this closes the loophole
WHAT CHANGED WHY IT MATTERS
No cash ever changes hands onsite for parts
The consumer approves a charge inside the app, not a cash handoff at a shop counter.
There's no moment where an offline side-deal can be proposed during a parts purchase.
No paper receipts to forge The app doesn't try to verify a third-party receipt at all. It verifies a photo of the installed
part, which is harder to fake convincingly and directly tied to the actual job.
Escort Mode is removed entirely The version where the user and vendor physically shop together unsupervised is gone. If a
user wants control over which part gets bought, they approve or reject the funding
request, they don't need to leave the house.
What this replaces: Both Option A (Multi-Receipt Log) and Option B (Escort Mode) are retired. Option C (No Parts
Required) stays unchanged, since it never involved a parts transaction in the first place.
FixIt One · Audit & Fix Blueprint Page 10 of 22
FIX 03
V E R I F I C AT I O N , K E P T
S T R I C T
Photos and proof of work stay mandatory. No
shortcuts here.
Loophole 3 identified a real problem: photos can't prove an AC is blowing cold air. But the fix is not to
weaken the proof requirement. It's confirmed and kept firm: photos and proof of any kind remain required
for every job, full stop.
What was proposed, and what actually happens to it
PROPOSAL DECISION
Mandatory 10-second video with audio
for mechanical/electrical jobs
Not adopted as a hard requirement for the beta. Worth revisiting later, but adds friction
and storage cost that isn't justified until the photo-only system is actually tested against
real disputes at volume.
A 4-digit handover confirmation code Not adopted. It confirms the vendor and consumer were both present, which already
happens naturally through the existing chat and milestone flow. It doesn't actually verify
the work quality, which was the real problem being solved.
Automated "Master Vendor" microbounty arbitration
Explicitly rejected. Outsourcing a dispute verdict to a random nearby vendor for a 2
OMR payout trades one trust problem for another, with no real accountability if that
vendor gets it wrong or has a personal relationship with either party.
Photos and proof of work required,
always
Confirmed. This was never in question. Every job, regardless of trade or complexity,
requires visual proof from both sides before completion can be marked.
The Real
Answer
Triple-Verify isn't being replaced. The honest fix to "photos can be ambiguous for mechanical
work" is accepting that some disputes will always need a human reviewer looking at the full
picture: the photos, the chat history, and the warranty terms together, not a single new gadget
that magically removes ambiguity.
What actually changes: Nothing in the verification mechanism itself. What changes is awareness: dispute volume for
mechanical and electrical trades should be watched specifically, since these are the categories most likely to need a
human judgment call rather than a clean photo match.
FixIt One · Audit & Fix Blueprint Page 11 of 22
FIX 04
M AS K I N G T H AT A C T U A L LY
H O L D S
Plus members see everything except a way to call
for free
The fix here is straightforward: a paid tier can absolutely make a vendor's profile more visible and
impressive, it just can never hand over the literal phone number or exact address before a job is paid for.
Visibility and contact are two different things, and the original spec accidentally merged them.
What FixIt One Plus actually unlocks now
1
Full storefront visibility
Plus members can see a Pro vendor's complete shop profile: bio, portfolio photos, reviews, and badges. Nothing
about the storefront content itself needs to be hidden.
2
Raw contact details stay scrubbed
Phone numbers and exact shop addresses are automatically filtered out of every profile view, for every tier, with no
exception. There is no subscription level that reveals them before payment.
3
Contact still routes through the app
If a Plus member wants to reach a vendor before formally posting a job, that conversation happens through the app's
existing masked chat and call relay, the same system already used for active jobs. No new contact channel is
needed, the existing one is simply made available earlier in the flow.
One Rule Visibility can be a paid feature. Contact information is never a paid feature. That single line keeps
every future tier, plan, or promotion from accidentally recreating this exact loophole again.
What this replaces: The original promise of direct phone number and shop location access for Plus members. The
masked, in-app relay already built for active jobs now simply extends to pre-booking conversations as well.
FixIt One · Audit & Fix Blueprint Page 12 of 22
MODULE 18
W O R KS H O P
D I A G N O S T I C S
For jobs where the user brings the item to the shop, not
the other way
Car repair, electronics, and similar trades work differently from home-service jobs. The user often doesn't
know what's wrong yet, and wants to physically take the item to a shop rather than have someone come to
them. A flat per-shop diagnostic fee was the first idea, but nobody pays 3 OMR five separate times just to
find out what's broken. The fix is a single rolling pass instead.
The Rolling Diagnostic Pass
[User pays a single 3 OMR Diagnostic Pass, once, inside the app]
 │
 ▼
 [User visits Shop 1. Mechanic can't find the issue in 10 minutes]
 Shop 1 taps "Cannot Diagnose / Release Pass"
 The 3 OMR stays locked, untouched, in escrow
 │
 ▼
 [User visits Shop 2. Mechanic finds it: "Your radiator fan is dead"]
 Shop 2 scans the user's Diagnostic Pass QR
 │
 ▼
 [App splits the pass: 1 OMR releases to Shop 2 immediately
 for successful troubleshooting time, the remaining 2 OMR
 rolls into the final repair bill as an instant discount]
From diagnosis to a locked repair job
1
Face-to-face price bargaining, right there in the shop
Once the issue is identified, the vendor and user negotiate a total fix price directly, the same way any in-person
repair quote works. The app isn't trying to control this conversation.
2
50% secures the job instantly
Once a price is agreed (for example 40 OMR), the user taps "Accept Shop Quote" and pays 50% (20 OMR) into app
escrow immediately. This is what stops the vendor from starting work on a customer who might just walk away once
parts are pulled apart.
3
The remaining 50% follows the standard rolling payout
Once the work is verified complete with the required photo proof, the remaining 50% follows the same rolling
warranty schedule established in Fix 1 (page 9), not a separate set of rules.
Why It
Works
The user never pays repeatedly just to get a diagnosis. The shop that actually solves the problem
gets rewarded immediately. And once a real price is agreed, the deposit makes the engagement
financially serious for both sides before any parts get touched.
FixIt One · Audit & Fix Blueprint Page 13 of 22
MODULE 19
T H E O P E N
M A R K E T P L A C E
Normal users buying and selling everyday items, with or
without bidding
This is the layer that turns FixIt One from a services-only app into something people open daily, the same reason
OpenSooq and OLX get checked constantly even when nobody currently needs a plumber. It only applies to
ordinary, lower-value goods. High-ticket items like cars get their own module, since the economics are
completely different (see Module 20).
Two paths, same listing flow
[User Lists an Item]
 │
 ┌────────────────────┴────────────────────┐
 ▼ ▼
 [Path A: Fixed Price] [Path B: Item Auction]
 Seller sets an exact price. Seller sets a starting bid.
 Buyer taps "Buy Now". Buyers place public bids over
 Funds lock in escrow instantly. a fixed window (e.g., 48 hours).
 Highest bid wins when time expires.
 │ │
 └────────────────────┬────────────────────┘
 ▼
 [In-App Meetup & QR Handoff Verification]
The trust handoff guard
STEP DETAIL
Funds lock the moment a deal is
made
Whether via Buy Now or winning an auction, the buyer's payment is held in escrow
immediately, before any physical meetup happens.
Buyer and seller meet in person The buyer inspects the item directly. There is no rush to release funds before the buyer is
actually satisfied.
QR scan releases the funds Once satisfied, the buyer scans the seller's item delivery QR code. This instantly releases
the funds (minus FixIt One's flat fee) to the seller. No cash changes hands, and neither side
risks a no-show or a swapped item after the fact.
Flat Fee,
Not %
This module takes a flat 5% transaction fee on peer-to-peer goods sales, not the 20% labor takerate used for services. Goods resale margins don't support a service-level commission, and a
lighter fee is what keeps casual sellers actually using the app instead of just listing on a free
classifieds site instead.
FixIt One · Audit & Fix Blueprint Page 14 of 22
MODULE 20
H I G H - T I C K E T L E A D -
L O C K
Nobody puts a 10,000 OMR car sale through an app's
escrow. Don't ask them to.
A flat percentage fee completely falls apart on big-ticket items. Taking 20% on a 10,000 OMR car sale is a
2,000 OMR fee, which is absurd, and no buyer is going to trust a new app to hold that much money anyway.
This module exists specifically to never put the platform in that position.
The mistake this avoids: Forcing a percentage-based escrow model onto high-value goods does two things at once: it
makes the fee look predatory, and it makes the platform look like it's trying to act as an unlicensed financial intermediary
for amounts it has no business holding.
How it actually works: bargain in-app, deal in person, pay a flat fee
[Seller lists a car, asking 10,000 OMR. Buyer offers 9,500 OMR.
 Seller counters at 9,700 OMR. All of this happens through structured
 in-app offers. Contact info stays 100% masked the entire time.]
 │
 ▼
 [Buyer and seller agree on 9,700 OMR]
 │
 ▼
 [App calculates a flat success fee from a fixed price tier,
 not a percentage: for example 15 OMR for vehicles, 3 OMR
 for electronics, regardless of the final agreed price]
 │
 ▼
 [Buyer pays a small Lead-Lock Deposit, e.g., 5 OMR, to
 unlock phone numbers and the physical inspection location]
 │
Deal succeeds IRL Seller flakes/lies
 │ │
 ▼ ▼
 [Seller pays the remaining [Buyer's deposit refunded
 flat fee. Deposit credits instantly, based on the
 toward it or refunds] in-app chat record]
Why It
Works
The actual car sale, the test drive, the cash or bank transfer for 9,700 OMR, all happens directly
between buyer and seller, the way it normally would. FixIt One never touches that money and never
needs to be trusted with it. What FixIt One sells here is the lead: a verified, masked introduction, paid
for with a small flat fee either side would happily pay for a serious buyer.
FixIt One · Audit & Fix Blueprint Page 15 of 22
MODULE 21
V O U C H E R
E C O N O M Y
One code system for disputes, marketing, and growth, all
at once
Instead of handling every dispute or promotion as a manual, one-off cash adjustment, a single alphanumeric
voucher system (format: FixIt One-XXXX) handles all three at once: wallet credit, plan unlocks, and fee
discounts.
[User Enters Voucher Code]
 │
 ┌──────────────────────┼──────────────────────┐
 ▼ ▼ ▼
 [Wallet Credit] [Time-Based Plan Unlock] [Fee % Discount]
 Adds a fixed OMR Unlocks Plus or Pro for Drops FixIt One's cut on
 balance instantly. a set number of days. the user's next job.
Three practical uses for the same system
1
Dispute resolution without a bank rollback
A minor dispute over a small job gets resolved with a code worth a couple of OMR in wallet credit instead of a manual
refund process. It costs the platform almost nothing in immediate liquidity and keeps the user inside the app for their
next booking.
2 Vendor onboarding without friction
A "1 Month Free Pro Plan" code handed out to local workshops during launch-area recruitment gets them using the
paid tier's features immediately, with zero signup friction.
3 Word-of-mouth growth
Codes printed on physical scratch cards or shared over WhatsApp give the platform a low-cost, trackable referral
mechanism that doesn't depend on paid ad spend.
Why this matters for Loophole 4: This is the same credit mechanism flagged earlier as a liability risk if overused for
warranty failures. Used here for small disputes and marketing, in modest amounts, it's a manageable cost. The
discipline is in the amount and the reason, not the mechanism itself.
FixIt One · Audit & Fix Blueprint Page 16 of 22
MODULE 22
R E V E R S E J U N K
A U C T I O N S
Turning household junk into a daily reason to open
the app
A broken washing machine or old copper pipes from a renovation usually just sit on a normal classifieds site
forever, because nobody knows what they're actually worth. This module flips that: instead of the seller
pricing junk, local buyers compete to name a price for it.
[User posts a single photo of a broken fridge, old car parts, or scrap copper]
 │
 ▼
 [Local scrap yards and repair shops on Pro/Elite tiers get an
 instant geofenced push notification about the new listing]
 │
 ▼
 [Businesses publicly bid cash to buy it]
 "I'll give you 5 OMR and collect it in an hour"
 "I'll give you 8 OMR"
 │
 ▼
 [User picks the best offer. Funds lock in escrow on acceptance.
 A pickup QR code confirms handoff and releases the payment]
Why this is worth building
FOR THE CASUAL USER FOR THE PLATFORM
Turns clutter into fast cash with zero
pricing guesswork, since competing
buyers set the real price.
Gives casual, non-service-needing users a reason to open the app regularly, which keeps
the platform relevant even between actual repair jobs.
No back-and-forth haggling
required, the highest bid simply
wins.
A flat transaction fee on the final pickup confirmation, with very low operational overhead
since there's no labor, warranty, or dispute complexity involved.
The Real
Value
This module costs almost nothing to run, since there's no warranty, no labor verification, and no
complex dispute surface. Its real value is engagement: a user who checks the app weekly for
scrap pickup offers is far more likely to remember it the next time something actually breaks.
FixIt One · Audit & Fix Blueprint Page 17 of 22
ANTI-POACH
T H E DY N A M I C F E E - D R O P
S C A L E
Make staying on the app the cheaper option on big
jobs
On a small job, a 20% cut feels fine to everyone. On a large job, that same 20% becomes a real number both
sides are tempted to avoid by going offline. The fix isn't a flat rate forever, it's a fee that shrinks as the job
size grows, so the platform's cut never becomes worth bypassing.
JOB SIZE FixIt One'S CUT WHAT HAPPENS TO THE DIFFERENCE
Standard jobs (under 15 OMR) 20% Full standard rate. Small jobs don't carry enough absolute value
to tempt anyone offline anyway.
Medium jobs (16 to 50 OMR) 12% The platform drops its cut to 12%, and passes 3% back to the
consumer as instant FixIt One Wallet cash-back for their next
booking.
Major jobs (50 OMR and above) 8% A flat 8% cut. At this size, both the vendor and consumer save
real money simply by staying on the platform instead of
negotiating a side deal.
Example: a 100 OMR transmission rebuild
 At a flat 20% rate: FixIt One takes 20 OMR --> real temptation to go offline
 Under this scale: FixIt One takes 8 OMR --> vendor keeps 92 OMR, fully
 covered by warranty + escrow
 The vendor's logic becomes: "Why would I risk losing my platform standing,
 my warranty enforcement, and my access to future jobs, just to dodge an
 8 OMR fee on a 100 OMR job?" At 20%, that math tempts people. At 8%, it doesn't.
Why It
Works
This directly targets the exact dollar amount where disintermediation risk is highest: large, highvalue jobs. Cutting the fee right where the temptation is strongest costs less in lost revenue than
losing the entire job to an offline deal would.
FixIt One · Audit & Fix Blueprint Page 18 of 22
MONETIZATION
S U B S C R I P T I O N T I E R S ,
R E V I S I T E D
Three plans, priced for a market that won't tolerate
friction
3 OMR per month for Plus and Pro checks out as a genuinely good price point: low enough that it's barely a
decision for the user, while still adding up to real recurring revenue at scale (the math is on page 20). A third
tier is added above Pro specifically for the high-volume players, like car dealers and scrap yards, who bring
serious inventory to the new marketplace modules.
FixIt One Plus
3 OMR/mo
Extended media uploads and
priority AI job-posting rewrites.
Full vendor storefront visibility,
contact details always masked.
Periodic exclusive coupon
drops and reduced-price bid
windows.
FixIt One Pro
3 OMR/mo
Unlimited bidding, no daily bidtoken cap.
Featured Bids pinned to the top
of the customer's job page.
Rich shop profile, Blue Tick
verification, reviews on every
job.
FixIt One Elite
7 OMR/mo
Built for car dealers, scrap
yards, and large workshops.
Reduced transaction fees on
high-ticket listings, up to a
monthly cap.
Bulk inventory uploads and
top-of-feed algorithmic
placement.
The strategic free-tier onboarding play
Highly reputable local vendors and car dealers who bring genuinely good inventory can be granted Pro or Elite free for the
first few months. They make the marketplace look active and credible from day one, which is what actually draws in casual
browsing users, far more effectively than any ad spend could at this stage.
Verdict
3 OMR for Plus and Pro is a low-friction price that real users in this market will barely think twice
about. Elite at 7 OMR is priced for businesses who already understand the value of inventory
placement, not casual users, which is the right split.
•
•
•
•
•
•
•
•
•
FixIt One · Audit & Fix Blueprint Page 19 of 22
THE NUMBERS
U N I T E C O N O M I C S & M O N T H LY
B U D G E T
What 100 paying users and modest GMV actually
looks like
These numbers are an early-scale planning estimate, not a guarantee. They're useful because they show the
model holds together even at a small, realistic user count, which is the right test for a beta budget.
The wallet top-up math, checked
STEP AMOUNT
User tops up wallet 50 OMR
Bonus credited (per the standard scale) +5 OMR (user now has 55 OMR balance)
User spends the full 50 OMR balance on a job FixIt One takes its cut at the moment the job closes, not at top-up
FixIt One's 20% cut on a 50 OMR job 10 OMR
Net profit after the 5 OMR bonus given at top-up 5 OMR per 50 OMR topped up
This confirms the original math: the take-rate is charged on job closure, not on deposit, so the bonus given at top-up is fully
recoverable through normal platform commission.
Monthly revenue at early scale (100 premium subscribers)
SOURCE MONTHLY TOTAL
100 Plus/Pro/Elite subscribers averaging 3 OMR
each
~300 OMR
Take-rate on an estimated 1,000 OMR monthly
GMV (services)
~200 OMR
Gross monthly income ~500 OMR
Where that 500 OMR actually goes
CATEGORY BUDGET PURPOSE
Hosting & Dev Costs ~200 OMR Database hosting, map and geocoding API tiers, server
costs, and ongoing development work. May need to flex
higher as the database and infra grow.
Founder Salary ~200 OMR Keeping the founding team liquid enough to build full-time
without outside income.
Disputes & Credit Buffer ~50 OMR Covers manual refunds and the voucher system's small
credit drops (Module 21).
FixIt One's Pocket ~50 OMR Actual take-home margin, which will vary with real running
costs as the app and database scale.
Total Allocated ~500 OMR Matches the gross monthly income exactly at this early
scale, with no separate marketing line yet.
Verdict
At just 100 paying subscribers and modest transaction volume, the platform covers its own
hosting, development, and founder salary, with a real buffer left for disputes and a genuine takehome margin. The exact split will flex as real infrastructure costs become clearer, but the model
holds together even at this early, modest scale.
FixIt One · Audit & Fix Blueprint Page 20 of 22
ROADMAP
U P DAT E D
R O A D M A P
Where the fixes and new modules actually land in the
build order
The original 3-phase roadmap still holds. These fixes and new modules slot into it without requiring a restart,
since most of them are corrections to logic that hadn't been built yet rather than rewrites of working code.
PHASE 1
CORE BUILD
Build the corrected escrow engine from day one
The Rolling Warranty Payout (Fix 1) replaces both conflicting payout models before any code is written
against either one. In-App Parts Funding (Fix 2) is built as the only parts flow, since the receipt and Escort
Mode flows it replaces were never finished anyway.
PHASE 2
LOCAL ALPHA
Test the fixes against real disputes and real vendors
The Dynamic Fee-Drop Scale and the corrected masking rules (Fix 4) get validated with the first 20 to 30
onboarded vendors, where disintermediation attempts are easiest to actually observe and measure.
PHASE 3
EXPANSION
Layer in the new marketplace modules
Module 18 (Workshop Diagnostics), Module 19 (The Open Marketplace), Module 20 (High-Ticket LeadLock), Module 21 (Voucher Economy), and Module 22 (Reverse Junk Auctions) roll out once the core
services loop is proven stable. The three-tier subscription system (Plus, Pro, Elite) launches alongside this
phase.
PHASE 4
BEYOND BETA
The items intentionally left out of this revision
Real third-party insurance partnerships, automated open-banking payment rails, and B2B supplier API
integrations all remain valid future ideas. They are correctly sequenced after the beta proves out, not before,
since each depends on partnerships or infrastructure that takes real time to secure properly.
What stays explicitly rejected, even now
REJECTED IDEA WHY IT STAYS OUT
Automated Master Vendor micro-bounty
arbitration
Replaces one trust problem with another. Disputes stay with internal review.
Platform-funded cash insurance Creates a moral hazard where damage claims become a cash incentive.
A flat percentage take-rate on high-ticket
goods
Produces an absurd fee on items like cars or real estate. Module 20's flat lead fee
replaces it.
FixIt One · Audit & Fix Blueprint Page 21 of 22
F I N A L W O R D An audit is only useful if it changes what gets built
Every loophole in this document existed because a rule looked complete in isolation but hadn't been tested
against another rule, or against an actual person trying to get around it. The fixes here aren't extra features
bolted on top. They're the same original intentions, made internally consistent.
What changed, in one table
AREA BEFORE AFTER
Vendor payout Two contradictory promises: full lock
vs. instant milestones
One schedule: 60% instant, 10% at warranty
halfway, 10% at clearance
Parts handling Forgeable receipts, unsupervised shop
trips
In-app funding requests, no cash or paper ever
involved
Verification Photos only, ambiguous for
mechanical work
Photos stay mandatory; ambiguous cases go
to human review, deliberately
Failed-job compensation Open-ended platform credits Bounded voucher amounts for minor disputes,
not warranty escalations
Payment verification Manual admin gate for every payment Automated where possible, manual only as a
genuine fallback
Plus tier Direct phone number and address
access
Full visibility, contact always routed through
the masked relay
High-ticket goods Not addressed, would have used the
20% service rate
Flat lead-lock fee, platform never touches the
actual sale price
The Real
Takeaway
None of these fixes make the platform more complicated to use. A consumer or vendor
experiences a simpler, faster, more honest version of the same app. The complexity that got
removed was the kind that only existed to paper over a contradiction, and contradictions are
exactly what sophisticated users and bad actors find first.
FixIt One · Audit & Fix Blueprint Page 22 of 22
Who this is for
For Consumers
Post a job, compare real
bids, and pay only when
the work is confirmed
done. Your money sits
safely in escrow until
then.
For Vendors
Get matched to jobs in
your trade and area, bid
without giving away your
number, and get paid
through a system that
protects you too.
For Advertisers & Partners
Reach a verified,
transacting audience of
homeowners and
tradespeople on a
platform built around trust,
not just traffic.
What makes this different
A
Funds held, not handed over.
Every payment sits in
escrow until work is verified
complete, milestone by
milestone.
B
Conversations stay on
record. Built-in monitoring
discourages off-platform
deals that leave both sides
unprotected.
C
Real people resolve
disputes. A dedicated review
team, not just an algorithm,
has the final say when
something goes wrong.
© 2026 FixIt One Marketplace Page 1 of 5
T R U S T & S A F E T Y , B U I LT I N
Every job, verified.
Every payment, protected.
FixIt One Marketplace connects households and businesses with
vetted tradespeople, and holds every payment in escrow until the
work is actually done. Here's exactly how, and what's coming
next.
NOW LIVE
F O R
C O N S U M E R S
Your money is protected until the job is
actually finished
Hiring someone you've never met to fix something in your home is an act of trust. We built
the entire payment system around removing the guesswork. You never pay a stranger
directly, and you never pay for work that wasn't done.
1
Post once, get real bids fast LIVE
Describe the problem, add a photo, and verified vendors in your area and trade are notified instantly.
You compare price, rating, and response time side by side, with no cold calls and no guesswork.
2
Your payment sits in escrow, not in someone's pocket LIVE
When you accept a bid, your payment is held securely, not released to the vendor, until you confirm
each stage of the work is done. Nobody gets paid for a job you haven't approved.
3
Every conversation stays on the record LIVE
Chat and calls happen inside the app, so there's always a record of what was agreed. Our system
actively watches for anyone trying to push the deal off-platform, for your protection as much as ours.
4
Disputes are resolved by people, not left unresolved LIVE
If something goes wrong, a real review team looks at the job timeline, the messages, and the evidence,
and can refund you, partially or in full, directly from the held funds.
+
Coming next: built-in damage coverage IN PROGRESS
We're rolling out automatic liability coverage on jobs, so if a vendor accidentally damages your property,
there's a clear claims path tied directly to your job, not a separate headache.
0%
Vendors are never paid out of your funds until you've approved the work.
That's not a policy promise. It's how the payment system is built to work,
milestone by milestone.
Your job, start to finish
→ → →
1
Post the Job
Describe the issue, add
a photo, set urgency
2
Compare Bids
Verified vendors respond
within minutes
3
Fund Escrow
Pay once, funds held
safely until done
4
Approve & Release
Confirm the work,
payment releases
instantly
© 2026 FixIt One Marketplace Page 2 of 5
F O R V E N D O R S Win jobs in your trade, get paid fairly, stay
protected
Most platforms ask tradespeople to pay upfront for leads that may never close. We built ours
the other way: low-cost entry while you're proving the platform out, real jobs matched to your
actual skill and area, and a payout system that protects your earnings just as much as it
protects the customer's.
1
Jobs that actually match your trade LIVE
You only see jobs in your category and service radius. An electrician never sees a plumbing job, and
you're never competing outside your specialty.
2
Ask for details without giving out your number LIVE
If a job listing is missing information, ask right in the app. No need to hand out your phone number to
bid, your contact details stay private until a customer actually commits to you.
3
Get paid in stages, automatically LIVE
Funds are already secured by the customer before you start. As you complete agreed milestones,
payouts release to you, so you're not chasing an invoice after the fact.
4
Low cost to start, fair terms as you grow LIVE
New vendors bid and win jobs with minimal upfront cost. You mostly pay a small share only when a job
actually closes. As you build a track record, optional plans unlock priority placement.
+
Coming next: liability coverage on every job IN PROGRESS
A single accident shouldn't put your livelihood at risk. We're integrating per-job liability coverage so
you're financially protected on the work you take through the platform.
+
Coming next: a margin calculator built into bidding IN PROGRESS
Enter your costs once, and we'll help you see your real margin on every job before you bid, so pricing
competitively doesn't mean pricing blind.
From notification to payout
→ → →
1-2-3 Most jobs release payment in two to three milestones: arrival, progress, and
completion. You're never waiting until the very end to see a payout.
1
Get Notified
Jobs in your trade and
radius, instantly
2
Submit a Bid
Ask clarifying questions
right in the app
3
Do the Work
Funds are already
secured before you start
4
Get Paid
Payouts release as
milestones are approved
© 2026 FixIt One Marketplace Page 3 of 5
F O R A D V E R T I S E R S &
P A R T N E R S
A trusted audience that's actively
transacting, not just browsing
Every user on FixIt One Marketplace is either mid-decision on a real home or business need, or
actively running a trade business. That's a meaningfully different audience from a passive
content feed, and our trust infrastructure is what keeps that audience engaged for the long
term.
2 Sides
Verified consumers actively
spending, and verified vendors
actively earning, both in one
ecosystem.
High Intent
Consumers arrive with a
specific, often urgent need, not
idle scrolling.
ID-Checked
Vendors are verified before
they can bid, which keeps the
audience credible for partner
offers too.
Why our trust model matters to you
WHAT WE BUILT WHY IT MATTERS FOR PARTNERS
Escrow-protected payments Transactions complete reliably, which means the platform retains users long
enough for your message to matter beyond a single visit.
Verified vendor onboarding A cleaner, more credible audience, useful for tool, materials, insurance, or
financial-services partners targeting real trade professionals.
On-platform communication Engagement happens inside the app over the life of a job, not in a single driveby session.
Dispute & insurance integration
(rolling out)
A platform people trust enough to keep using is a platform where your
placement keeps getting seen.
2027
As we scale city by city, partner and advertiser placements expand alongside
verified vendor and consumer growth. We'll share audience and inventory
details directly as each market opens.
© 2026 FixIt One Marketplace Page 4 of 5
W H AT ' S N E X T Where we're headed, and what we need to get
there
Everything on the previous pages is either live today or already in active development. None
of it stops here. The roadmap below is how we keep raising the bar on trust as the platform
grows, and none of it happens without the team behind it.
NEXT UP Liability coverage on every job
Per-job insurance integration so vendors and consumers are both financially protected if
something genuinely goes wrong on site, not just protected on payment.
NEXT UP Smarter, faster dispute resolution
Expanding the review team's tooling so disputed jobs are looked at and resolved faster,
with clearer evidence trails for everyone involved.
MID-TERM A margin calculator built into bidding
Helping vendors price competitively without pricing blind, using their own cost inputs
rather than guesswork.
MID-TERM Deeper protection against off-platform deals
Continuing to strengthen the systems that keep conversations, payments, and agreements
where both sides are actually protected.
LOOKING AHEAD City-by-city expansion across Oman and the GCC
Growing market by market, with vendor density and trust tooling proven out before each
new launch, not the other way around.
This only works with your support
None of the above ships on its own. Getting from where we are today to where this roadmap
points takes continued backing from the people who believe in this, and a development team
that's ready to commit to building it well rather than building it fast.
From our supporters
Continued confidence and
backing as we prove out each
new market and feature.
From our development team
A clear, shared commitment to
the roadmap above, and the
engineering discipline to build it
right.
From everyone involved
Patience with a trust-first
platform that earns growth
carefully, rather than chasing it
carelessly.
Acknowledged and supported by
Founding Team
Name & Signature
Development Lead
Name & Signature
Date
© 2026 FixIt One Marketplace Page 5 of 5