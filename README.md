# FixIt Marketplace

Trust-first, two-sided service-on-demand marketplace (Oman / GCC). Connects
consumers needing home/business trade services with vetted vendors who bid
competitively, with milestone-based escrow and AI disintermediation protection.

This repo is the **project skeleton** — a runnable foundation, not the full
platform. See `FixIt Marketplace - PRD and System Architecture Blueprint.pdf`
for the complete spec.

## ⚠️ Security first

Never commit real secrets. Copy `.env.example` → `.env` and fill it with **your
own, rotated** credentials. The `.env` file is gitignored. The Supabase
`service_role` key and PayPal secrets are backend-only — they must never reach a
client bundle.

Build/test PayPal against **sandbox** until the escrow flow and the licensed
payment-facilitator arrangement (PRD §1.C) are confirmed by legal counsel.

## Layout

```
.
├── .env.example            # env template (placeholders only)
├── db/
│   ├── migrations/0001_init.sql   # schema (PRD §3.A.2)
│   └── migrations/0002_rls.sql    # row-level security baseline
├── scripts/migrate.mjs     # apply migrations over DATABASE_URL
└── apps/
    ├── backend/            # NestJS API — full module set (below)
    ├── admin-web/          # Next.js 16 Command Center (premium UI + realtime)
    └── mobile/             # Expo/RN app (OTP login + job creation)
```

## What's actually implemented

- **DB**: 6 migrations — core schema + PostGIS, RLS, extended entities (Q&A,
  chat, milestones, subscriptions, reviews, insurance, OTP, notifications),
  KPI views + `compute_refund()` + ledger-immutability trigger, routing match
  function, and Supabase role grants.
- **Backend API** (NestJS):
  - `POST /api/auth/otp/request` · `/verify` — phone-OTP login, JWT, roles.
  - `jobs` — create (→ moderation → OPEN → routing), `mine`, vendor `feed`, get.
  - `bids` — submit (verified-only, sealed), list, `select` → milestones + escrow.
  - `routing` — async fan-out worker (PostGIS eligible vendors, notifications, WS).
  - `escrow` — PayPal sandbox state machine + **80/20 refund** resolver.
  - `moderation` — Tier-1 detector + admin queue/approve/reject.
  - `vendors` — profile, verification, compliance.
  - `realtime` — Socket.IO gateway (+ optional Redis adapter).
- **Admin web**: premium dark glassmorphic Command Center — triage queue (live
  Supabase realtime), AI split-view, **live 80/20 dispute calculator**, vendor
  compliance (live API w/ seed fallback), KPI reports.
- **Mobile**: phone-OTP login → category job-card creation → my-jobs, wired to
  the backend API.

## Quickstart

```bash
cp .env.example .env                 # fill in YOUR (rotated) credentials
npm install                          # workspaces

# Apply DB schema + grants to your Supabase (REQUIRED — fixes "permission denied"):
node scripts/migrate.mjs             # runs db/migrations/*.sql in order

npm run dev:backend                  # http://localhost:3000/api
npm run dev:admin-web                # http://localhost:3001
npm run dev:mobile                   # Expo
```

Per-app env: `apps/admin-web/.env.local.example` (NEXT_PUBLIC_*),
mobile reads `EXPO_PUBLIC_API_URL`.

## Roadmap

Follows the PRD §3.B 4-quarter plan. Implemented: Q1 (auth/OTP, geo schema,
vendor onboarding), Q2 (routing, bidding, escrow), Q3 slices (Tier-1 moderation,
admin portal, dispute engine). Next: Tier-2 LLM moderation, masked-relay calling,
insurance API integration, subscription/trial enforcement.
