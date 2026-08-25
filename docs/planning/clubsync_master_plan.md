# 🧠 ClubSync — Expert Development Roadmap

> **Context:** React Native (Expo) mobile app + HTML web prototype + PostgreSQL schema.
> Current state: UI is largely built with mock data. Schema exists. Backend is not yet connected.
> The plan below is ordered by **dependency** — each phase unlocks the next.

---

## ⚡ The Core Principle: **Don't Build What You Can't Test**

Your original 6-step plan is directionally correct but has one fatal flaw:
> *Building ALL the UI before touching the backend means you'll refactor everything when real data shapes differ from your mock data.*

The fix: **interleave UI and backend in thin vertical slices** — one feature end-to-end at a time.

---

## Phase 0 — Foundation & Contracts *(Before Writing a Single New Screen)*

> [!IMPORTANT]
> This phase is the most underrated. Skipping it causes 80% of debugging pain in Phase 3.

### 0.1 — Lock the API Contract First
- Define every API endpoint as an **OpenAPI 3.0 spec** (`api-spec.yaml`) before writing backend code.
- Agree on exact JSON response shapes, error codes (`4xx`, `5xx`), and pagination strategy.
- Tool: use [Swagger Editor](https://editor.swagger.io/) or **Scalar** (modern alternative).
- This lets mobile + web teams work in parallel against the spec using mock servers.

### 0.2 — Environment Setup
| Environment | Purpose |
|---|---|
| `local` | Developer machine (SQLite or local Postgres) |
| `staging` | Mirrors production, used for QA and demos |
| `production` | Live users, locked down, no debugging |

- Set up `.env` files for all 3 envs. You already have `.env` and `.env.example` in `/mobile` ✅
- Use a **secrets manager** (Doppler free tier or GitHub Secrets) — never commit real keys.

### 0.3 — Version Control Discipline
- Use **Git branches**: `main` (prod-stable), `develop` (integration), `feature/xxx`, `fix/xxx`.
- Set up **branch protection** on `main` — no direct pushes, require PR reviews.
- This saves you from "it worked yesterday" disasters.

---

## Phase 1 — UI: Finalize Views (But Smart)

> [!TIP]
> Don't pixel-perfect every screen now. Get all **user flows navigable** with mock data first. Polish after backend is connected.

### 1.1 — Audit All Screens Against User Roles
Based on your `ClubSync_Permissions_Hierarchy_and_Views_Guide.docx`, confirm every screen renders correctly for:

| Role | Key Screens |
|---|---|
| **Student (Internal)** | Home, Campus Events, Competitions, Clubs, Profile |
| **Student (External)** | Competitions Discovery, Public Club Profiles |
| **Club Core Committee** | Event Management Hub, Finance Ledger, Recruitment |
| **Faculty Advisor / Admin** | Analytics Dashboard, Annual Report Export |

### 1.2 — Screens Still Needed (Based on Your Implementation Plan)
- `[ ]` **Admin Analytics Dashboard** — Bar charts, Trophy Leaderboard, P&L per event
- `[ ]` **Ticketing Desk** — QR generation, tier management, live sales counter
- `[ ]` **QR Attendance Scanner** — Camera-based check-in screen
- `[ ]` **Winner Publisher** — Record 1st/2nd/3rd, auto-dispatch certificates
- `[ ]` **Budget & Expense Ledger** — Real-time income/expense tracking
- `[ ]` **Event Archive** — Multi-year filter, college-wise search

### 1.3 — Design System Rules (Enforce Before Scaling)
- Lock a **color palette, font scale, spacing scale, and component library** now.
- In React Native, create a `src/lib/theme.ts` with all design tokens.
- Every component uses tokens — no hardcoded `#hex` or `px` values directly.
- This makes the app look consistent and professional, not cobbled together.

### 1.4 — Accessibility (Non-Negotiable)
- All touchable elements: minimum **44×44pt** hit area.
- All text: minimum **contrast ratio 4.5:1**.
- Screen reader labels on icon-only buttons.
- Why: Google Play and App Store reject apps with severe a11y failures.

---

## Phase 2 — Backend: Build Feature-by-Feature (Not All at Once)

> [!IMPORTANT]
> Do NOT build the entire backend at once. Build one vertical slice, connect it, verify it works, then move to the next. This is the **most important engineering discipline** of this phase.

### 2.1 — Tech Stack Decision (Lock It)

| Layer | Recommended Choice | Why |
|---|---|---|
| **Runtime** | Node.js (TypeScript) + Express / Fastify | Matches your existing TS mobile codebase |
| **Database** | PostgreSQL | You already have `schema.sql` ✅ |
| **ORM** | Prisma | Type-safe, generates types that match your mobile `types/` folder |
| **Auth** | Supabase Auth OR Firebase Auth | Battle-tested, handles JWT, refresh tokens, college email verification |
| **File Storage** | Supabase Storage OR AWS S3 | Certificates, receipts, club logos |
| **Real-time** | Supabase Realtime OR Socket.io | Live ticket count, live check-in updates |
| **Email** | Resend.com | Certificate dispatch, event reminders |
| **Hosting** | Railway.app (backend) + Vercel (web) | You already have `vercel.json` ✅ |

### 2.2 — Build Order (Vertical Slices, One at a Time)

```
Slice 1: Auth ──────────────────────────────────────────── [FIRST]
  - College email OTP / Google OAuth
  - JWT issuance + refresh
  - Role assignment (Student / Committee / Admin)
  - Connect to OnboardingScreen.tsx

Slice 2: Colleges & Users ───────────────────────────────
  - COLLEGES table CRUD (seed with your national colleges list)
  - USERS profile (PRN, college, department, year)
  - Replace mockData.ts COLLEGES array with real API call

Slice 3: Clubs ──────────────────────────────────────────
  - CLUBS table + follow/unfollow API
  - Replace ClubsScreen.tsx mock data with real API
  - Visibility gating (public vs. college-only)

Slice 4: Events (Campus) ────────────────────────────────
  - EVENTS table CRUD for Committee members
  - GET /events?college_id= for campus-filtered Events screen
  - Replace EventsScreen.tsx mock data

Slice 5: Competitions & Registrations ───────────────────
  - COMPETITIONS + TEAMS + REGISTRATIONS tables
  - Registration flow with payment (Razorpay integration)
  - QR ticket generation (use `qrcode` npm package)

Slice 6: Finance & Analytics ────────────────────────────
  - FINANCE_TRANSACTIONS table
  - Aggregate queries for Analytics Dashboard
  - Annual Report PDF export (use `pdfkit` or `puppeteer`)

Slice 7: Winners & Certificates ─────────────────────────
  - WINNERS table
  - Auto-generate certificates (HTML template → PDF)
  - Email dispatch via Resend
```

### 2.3 — API Security Checklist (Every Endpoint)
- [ ] Auth middleware — every protected route checks JWT
- [ ] Role-based access control — Committee can only edit their own club's events
- [ ] Input validation — use `zod` for all request body validation
- [ ] Rate limiting — `express-rate-limit` to prevent abuse
- [ ] SQL injection protection — Prisma's parameterized queries handle this ✅

---

## Phase 3 — Integration: Connect & Test (The Real Work)

> This is where "it works on my machine" either becomes truth or disaster.

### 3.1 — Replace Mock Data Systematically

For each screen, follow this exact pattern:
```
1. Keep existing mock data as a fallback
2. Add API call (React Query / SWR for caching)
3. Add loading skeleton UI
4. Add error state UI ("Couldn't load clubs. Tap to retry.")
5. Test with real data
6. Remove mock data fallback
```

Never go to step 6 until steps 3 and 4 are done. Users will always hit network errors.

### 3.2 — State Management (You're at national scale now)

| Scenario | Tool |
|---|---|
| Server data (events, clubs, users) | **React Query** (TanStack Query) |
| Global client state (current user, onboarding) | **Zustand** |
| Form state | **React Hook Form** + **Zod** |

Why not Redux? It's overkill for this architecture and adds cognitive overhead.

### 3.3 — Offline Support (Critical for College Fest Scenarios)

During a live fest, WiFi is unreliable. Your QR scanner MUST work offline.
- Cache the registered attendee list locally using **MMKV** (fast) or **AsyncStorage**.
- Queue check-in events locally, sync when connectivity returns.
- Show connection status banner: "🔴 Offline — check-ins will sync when connected."

---

## Phase 4 — Review: The 3-Layer Audit

> [!NOTE]
> Most developers skip this phase. The ones who don't are the ones whose apps don't get embarrassing bug reports.

### Layer 1 — Code Quality Audit
- Run `tsc --noEmit` — you already did this ✅ (per PROGRESS.md)
- Add **ESLint** + **Prettier** with strict rules if not already set up
- Run `npm audit` to check for vulnerable dependencies
- Remove all `console.log` statements (use a proper logger like `pino`)
- Check for memory leaks: event listeners not cleaned up in `useEffect`

### Layer 2 — UX/Flow Audit (Walk Every User Journey)

For each user role, do a **fresh install** walkthrough:
```
Student: Install → Onboard → Browse Events → Register → Get QR Ticket → Attend → Get Certificate
Committee: Login → Create Event → Set Ticket Tiers → Go Live → Scan QR → Record Winners → Export Report
Admin: Login → View Analytics → Generate NAAC Report → Export PDF
```

Document every point of friction. Fix it before launch.

### Layer 3 — Security Audit
- [ ] No API keys in mobile app bundle (they can be extracted from APK)
- [ ] All sensitive operations go through your backend — never call DB directly from mobile
- [ ] Razorpay webhook signature verification
- [ ] JWT expiry set correctly (access: 15 min, refresh: 7 days)
- [ ] CORS configured to only allow your domains

---

## Phase 5 — Deployment: Zero-Downtime Production Setup

### 5.1 — Infrastructure Architecture

```
                    ┌─────────────────────┐
Users (Mobile)  ──► │  Expo EAS Update    │ (OTA updates, no re-install)
Users (Web)     ──► │  Vercel (Frontend)  │ ← you have vercel.json ✅
                    └─────────────────────┘
                             │
                    ┌─────────────────────┐
                    │  Railway (Backend)  │ (Node + Express API)
                    │  + Supabase (DB)    │ (PostgreSQL + Auth + Storage)
                    └─────────────────────┘
```

### 5.2 — Mobile App Build & Release (EAS Build)

You already have `eas.json` ✅. Use:
```bash
# Internal testing (your college committee)
eas build --profile preview --platform android

# Production (Google Play / App Store)
eas build --profile production --platform all
```

### 5.3 — Deployment Checklist
- [ ] All `.env` secrets set in Railway + Vercel dashboards (not in code)
- [ ] Database migrations run via Prisma: `prisma migrate deploy`
- [ ] Staging deploy and smoke test first
- [ ] Health check endpoint: `GET /api/health` returns `{ status: "ok", db: "connected" }`
- [ ] Set up **Sentry** for crash reporting (free tier is enough to start)
- [ ] Set up **automated daily DB backup** in Supabase (1-click toggle)

---

## Phase 6 — Performance & Monitoring: Know Before Users Tell You

> [!TIP]
> The goal of Phase 6 is to catch problems in minutes, not days.

### 6.1 — Key Metrics to Track from Day 1

| Metric | Tool | Threshold |
|---|---|---|
| API Response Time (p95) | Railway metrics / Datadog | < 300ms |
| App Crash Rate | Sentry | < 0.1% |
| Screen Load Time | Expo Performance | < 2s |
| DB Query Time | Supabase dashboard | < 100ms |
| Ticket Sales Funnel Drop-off | PostHog (analytics) | Track per step |

### 6.2 — Load Testing (Before a Big Fest)

Before GedIT or any major event with 500+ expected registrations:
```bash
# Simulate 500 concurrent users registering
npx artillery run load-test.yml
```

Find the breaking point in staging, not production.

### 6.3 — The On-Call Checklist (For Your Team)

- Sentry alerts go to a WhatsApp/Telegram group instantly
- Runbook: "If DB is down → do X. If auth fails → do Y."
- Feature flags (use **Flagsmith** free tier) to instantly disable broken features without redeployment

---

## 🗓️ Realistic Timeline (Solo / Small Team of 3)

| Phase | Estimated Time |
|---|---|
| Phase 0 — Foundation | 2–3 days |
| Phase 1 — UI Finalization | 1–2 weeks |
| Phase 2 — Backend (all 7 slices) | 3–4 weeks |
| Phase 3 — Integration | 1–2 weeks |
| Phase 4 — Review | 3–5 days |
| Phase 5 — Deployment | 2–3 days |
| Phase 6 — Monitoring Setup | 1–2 days |
| **Total** | **~8–10 weeks** |

> [!WARNING]
> The #1 cause of project delay is **scope creep** — adding new features during integration.
> Freeze the feature list at the end of Phase 1. New ideas go into a `Future Plans.docx` (you already have one ✅).

---

## 🧭 The Single Most Important Rule

> **Ship a working vertical slice every week.**
> Not a perfect app in 10 weeks — a partially real app in 1 week, then make it more real every week.
> This keeps morale high, catches architectural mistakes early, and gives you something to demo.

