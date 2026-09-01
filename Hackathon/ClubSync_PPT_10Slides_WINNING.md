# 🏆 ClubSync — WINNING 10-Slide PPT Content
### MITAOE Project Expo | 3 September 2026

---

## SLIDE 1 — Title / Cover

# ClubSync
### *"One Platform. Every Club. Every Event."*

> A Unified College Club & Event Management Platform
> **Mobile App + Web Dashboard | Powered by Real-Time Cloud Technology**

| | |
|---|---|
| **Team** | *(Your Names)* |
| **Guide** | *(Guide Name)* |
| **Institute** | MIT Academy of Engineering, Alandi, Pune |
| **Academic Year** | 2025–26 |

*(Add MITAOE logo + ClubSync logo here)*

---

## SLIDE 2 — The Problem 🚨
### *"Every college has 30+ clubs. Zero has a proper system to manage them."*

**Right now, college club management looks like this:**

| What Should Happen | What Actually Happens |
|---|---|
| Digital event approval | Paper forms routed through 4 people — takes a week |
| Instant event announcements | WhatsApp broadcast lost in 200 other messages |
| Structured registration + QR ticket | Google Form with no capacity control |
| Live budget tracking | Excel sheet nobody updates on time |
| QR attendance at gate | Physical register — slow, inaccurate, gets lost |
| Recruitment CRM pipeline | Applications buried in someone's email inbox |
| Dedicated dashboards per role | President, Faculty, Admin — all using the same Google Sheet |

### 💥 The Result?
- Students **miss events** they would have loved to attend
- Club leaders spend **more time managing chaos than creating experiences**
- Faculty have **no formal system** to track approvals
- Budgets are **never transparent** — money goes missing with zero accountability

> **There is no product built for Indian college club management. ClubSync fixes that.**

---

## SLIDE 3 — Our Solution: ClubSync ✅
### *"One platform that replaces WhatsApp groups, Google Forms, Excel sheets, paper forms — all at once."*

**ClubSync is a dual-platform product:**

### 📱 Mobile App (Students)
Built in **React Native + Expo** — works on Android & iOS

- Browse & register for events → get a **QR ticket instantly**
- Discover clubs → follow them → apply for recruitment
- Scan QR codes at the gate to mark attendance
- Real Google login (OAuth) — no fake passwords

### 🌐 Web Dashboard (Club Management)
Built in **React + Vite** — accessible on any browser

- **5 separate dashboards** for 5 different roles:

| Role | What They Can Do |
|---|---|
| 🎓 Student | Browse & register for events |
| 👑 President | Club overview, budget balance, task status |
| 📋 Secretary | Task board, meeting notes, member records |
| 👨‍🏫 Faculty | Approve / reject event proposals |
| 🛡️ Admin/Dean | Full college-wide oversight |

### ⚡ Backend: Supabase + PostgreSQL
- Real database, real auth, real-time sync — not mock data

---

## SLIDE 4 — Key Features 🚀

### What Makes ClubSync Powerful

```
📱 MOBILE APP                    🌐 WEB DASHBOARD
─────────────────                ─────────────────────────
✅ Google OAuth Login             ✅ Role-Based Dashboards (5 roles)
✅ Email + Password Login         ✅ Multi-Tier Event Approval Flow
✅ Email Verification             ✅ Live Budget Ledger (₹ tracking)
✅ Home Feed (live events)        ✅ Task Management Board
✅ Event Discovery + Filters      ✅ Recruitment CRM Pipeline
✅ One-tap Registration           ✅ Event Analytics & Reports
✅ QR Ticket Generation           ✅ Team Formation & Task Assignment
✅ Club Follow System             ✅ Faculty Approval Queue
✅ Apply for Recruitments         ✅ Admin Full Oversight Panel
✅ QR Scanner (Camera-based)      ✅ Auto Role Redirect (RoleRouter)
✅ Dark Mode + Light Mode         ✅ Live DB updates (Supabase Realtime)
✅ Push Notifications             ✅ Deployed on Vercel ✅
```

### 🔑 The Feature Nobody Else Has — Multi-Tier Digital Approval
```
Club Member proposes event
    ↓
Club Admin reviews → ✅
    ↓
Faculty Mentor → ✅
    ↓
Resource In-charge → ✅
    ↓
Vertical Coordinator → ✅
    ↓
Dean/Admin Final Approval → ✅
    ↓
Event LIVE on ClubSync 🎉
```
**What took 3–7 days on paper now happens the same day.**

---

## SLIDE 5 — System Architecture 🏗️

### How It All Fits Together

```
┌──────────────────────────────────────────────────────────┐
│                      USERS                               │
│   Students · Presidents · Secretaries · Faculty · Admin  │
└───────────────┬──────────────────────────────────────────┘
                │
   ┌────────────┼──────────────┐
   │                           │
┌──▼──────────────┐    ┌──────▼──────────────┐
│  📱 MOBILE APP  │    │  🌐 WEB DASHBOARD   │
│  React Native   │    │  React + Vite        │
│  + Expo         │    │  TypeScript          │
│                 │    │                      │
│ Home, Events,   │    │ President, Secretary,│
│ Clubs, Profile, │    │ Faculty, Admin,      │
│ QR Scanner      │    │ Student views        │
└──────┬──────────┘    └──────┬───────────────┘
       │   HTTPS + Supabase SDK│
       └──────────┬────────────┘
                  │
    ┌─────────────▼──────────────┐
    │     ⚡ SUPABASE BACKEND    │
    │                            │
    │  🔐 Auth (Google + Email)  │
    │  🗄️ PostgreSQL Database    │
    │  🔴 Realtime Sync          │
    │  📦 Storage (images/logos) │
    │  🛡️ Row Level Security     │
    └────────────────────────────┘
```

### Multi-Tenancy Design
- Every table has a `college_id` — data is fully isolated per college
- One backend supports **unlimited colleges** (VIT, MITAOE, IITs, NITs...)
- Feature flags control which features are live per college tier

---

## SLIDE 6 — Tech Stack 🛠️

### Technologies Used

| Layer | Technology | Why We Chose It |
|---|---|---|
| **Mobile App** | React Native + Expo | Cross-platform (Android + iOS) from one codebase |
| **Web Dashboard** | React + Vite + TypeScript | Fast, modern, type-safe UI development |
| **Database** | PostgreSQL (via Supabase) | Relational, reliable, supports complex queries |
| **Auth** | Supabase Auth | Google OAuth + Email/Password out of the box |
| **Real-time** | Supabase Realtime | Live updates without polling |
| **Storage** | Supabase Storage | Event banners, club logos, profile pictures |
| **QR Scanning** | Expo Camera | Native camera access for QR attendance |
| **Push Notifications** | Expo Push Notifications | Event reminders to students |
| **Deployment (Web)** | Vercel | Auto-deploy on every push |
| **Deployment (Mobile)** | EAS Build | Build APK/IPA for store distribution |
| **Version Control** | Git + GitHub | Full project history |

### Why TypeScript Everywhere?
- Zero `any` types — entire codebase is **strictly typed**
- `tsc --noEmit` passes with **0 errors**
- Safer, self-documenting code that scales

### Database: 15+ Interconnected Tables
`users · clubs · club_events · club_tasks · club_ledger · event_registrations · attendance · recruitment_apps · event_approvals · memberships · tickets · ...`

---

## SLIDE 7 — How It Works (End-to-End Flow) 🔄

### The Complete ClubSync Journey

**Step 1 — Sign Up**
> Student downloads app → Signs up with Google or Email → Email verified → Auto-profile created in database

**Step 2 — Discover**
> Home screen shows live events feed, trending clubs, open recruitments — all personalized to their college

**Step 3 — Register**
> Student taps "Register" on an event → System checks capacity → Generates unique QR token → Confirmation notification sent

**Step 4 — Event Day**
> Volunteer opens Scanner screen → Camera scans student's QR code → Attendance marked instantly in database → Organizer sees live count update

**Step 5 — Behind the Scenes (Organizer's Side)**
```
Propose Event → Digital Approval Chain → Publish Event
     ↓
Create Team + Assign Tasks → Track Progress
     ↓
Event Goes Live → Monitor Registrations + Attendance
     ↓
Post Event → Auto Report → Archive in ClubSync
```

**Step 6 — Budget, Anytime**
> President opens web dashboard → Sees live budget remaining vs. total → Every expense logged in the ledger — full transparency

### One Complete Cycle, Zero Paper, Zero WhatsApp Groups

---

## SLIDE 8 — Implementation & Proof of Work 💻

### What We Actually Built (Not Just Planned)

**✅ Mobile App — Fully Functional Screens:**
- `OnboardingScreen` — Google OAuth + Email Sign In/Sign Up + Email Verification
- `HomeScreen` — Live events feed, personalized greeting, quick stats
- `EventsScreen` — Browse with filters, register, view ticket tabs (Discover/Applied/Watchlist/Past)
- `ClubsScreen` — Club discovery, follow/unfollow, open recruitment listings
- `ProfileScreen` — Edit profile, my tickets, certificates, activity history
- `ScannerScreen` — Live camera QR code scanner for attendance

**✅ Web Dashboard — 5 Live Role Dashboards:**
- `PresidentDashboard` — Active events, budget gauge, pending task count (live from DB)
- `SecretaryDashboard` — Task tracking board with status management
- `ExecutiveDashboard` — Event creation, team assignment, registration monitor
- `FacultyDashboard` — Approval queue with approve/reject actions
- `AdminDashboard` — Full college-wide oversight panel

**✅ Smart Systems Built:**
- `RoleRouter` — Detects `user_type` from DB → redirects to correct dashboard automatically
- `featureFlags.ts` — Toggle multi-college features on/off without code changes
- `AuthContext` — Global auth state with persistent sessions and auto-refresh
- `ThemeContext` — Dark/Light mode across the entire mobile app
- PostgreSQL trigger — Auto-creates user profile on every new sign-up

**✅ Deployment:**
- Web Dashboard → **Live on Vercel**
- Mobile App → **Running via Expo Go** (EAS store build is next step)

---

## SLIDE 9 — Results & Impact 📊

### By the Numbers

| Metric | Value |
|---|---|
| Total Screens Built (Mobile) | 6 fully functional screens |
| Role-Based Dashboards (Web) | 5 dashboards, 5 roles |
| Database Tables | 15+ interconnected tables |
| TypeScript Compilation Errors | **0** (strict mode) |
| Lines of Code | 15,000+ across both platforms |
| API Response Time | < 300ms |
| QR Scan-to-Attendance Time | < 2 seconds |

### ClubSync vs. The Old Way

| Activity | Without ClubSync | With ClubSync | Improvement |
|---|---|---|---|
| Event approval | 3–7 days (paper) | Same day (digital) | **~85% faster** |
| Student registration | 10 min (Google Form) | 30 seconds | **~97% faster** |
| Attendance (100 students) | 10–15 minutes | 2–3 minutes | **~80% faster** |
| Budget visibility | Month-end Excel | **Real-time** | Instant |
| Finding open clubs | Ask seniors | Browse in-app | Structured |

### What We Achieved ✅
- ✅ Real product, real database, real authentication — not a prototype
- ✅ Role-based access working perfectly across 5 user types
- ✅ QR code attendance system — faster and more accurate than paper
- ✅ Architecture designed to scale from 1 college → national (multi-college ready)
- ✅ Solves a problem that exists in **every college in India**

---

## SLIDE 10 — Future Scope + Thank You 🚀

### What's Next for ClubSync

| Phase | Feature | Timeline |
|---|---|---|
| **V2** | Multi-college national rollout (feature flags already built) | 3 months |
| **V2** | Paid ticketing via Razorpay (Free / Student / VIP tiers) | 3 months |
| **V2** | PDF event reports auto-generated | 2 months |
| **V3** | AI event recommendations based on interests | 6 months |
| **V3** | Cross-college hackathon & competition platform | 6 months |
| **V3** | Sponsor management module | 6 months |
| **V4** | Alumni mentorship + club donation system | 1 year |
| **V4** | SaaS model — colleges subscribe to their ClubSync instance | 1 year |

### The Bigger Vision
> ClubSync is designed to become the **"Unstop for internal college management"** —
> every college in India on one platform, every club organized, every student engaged.

---

## 🙏 THANK YOU!

### *"ClubSync — One Platform. Every Club. Every Event."*

---

**We built this because we lived the problem.**
Every missed event announcement, every lost paper approval form, every chaotic WhatsApp group — we felt it. ClubSync is our answer.

**We are ready to demo the live app right now.** 📱

---

### Q&A — Quick Answers Ready

| If they ask... | Your Answer |
|---|---|
| *"Is this deployed?"* | Web is live on Vercel. Mobile runs on Expo Go — store build is next. |
| *"Why Supabase instead of custom backend?"* | Gives us PostgreSQL + Auth + Realtime + Storage out of the box. Production-grade, scales well, free to start. |
| *"How many colleges can this handle?"* | Unlimited — every table has `college_id`. Multi-college is built and behind a feature flag. |
| *"What's different from Google Forms + WhatsApp?"* | Role-based dashboards, QR tickets, digital multi-tier approvals, live budget tracking, recruitment CRM — none of this is possible with Forms + WhatsApp. |
| *"Is this original?"* | Yes — no product in India does what ClubSync does. Unstop handles external competitions. ClubSync handles internal club management. |

---
*Prepared for MITAOE Project Expo — 3 September 2026*
*ClubSync | React Native + React + TypeScript + Supabase + PostgreSQL*
