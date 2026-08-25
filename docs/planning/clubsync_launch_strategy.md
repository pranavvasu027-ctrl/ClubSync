# ClubSync — Versioned Launch Strategy

## The Core Problem with Your Current Plan
Your V1 and V2 are the same thing. There's no clear definition of "smooth."
No mention of **backend**, **multi-tenancy**, or **who enters data for new colleges**.
This plan fixes all of that.

---

## Version Roadmap

### 🔵 V0 — Internal Alpha (Right Now, Before Any Launch)
**Who:** You + 5–10 trusted VIT friends only (TestFlight / internal APK)  
**Goal:** Kill all bugs before real students see it

**What to build:**
- Replace ALL mock data with a real backend (Supabase / Firebase / your own Node API)
- Real Google Sign-In working (currently mocked)
- Real gate pass QR generation + attendance marking backend
- Observer role working end-to-end
- Remove president edit mode from app (as discussed)

**Success criteria:**  
Zero crashes in 48 hours of usage by 10 testers

> [!CAUTION]
> **Do NOT skip V0.** Launching with mock data is a public embarrassment. Right now your app has hardcoded data (`Pranav Vasu`, `1251070582`, etc.). Real users will see this.

---

### 🟢 V1 — VIT Closed Beta
**Who:** ~100–200 VIT students (invite only, spread by word of mouth)  
**Platform:** Android APK link (no Play Store yet — saves time)  
**Duration:** 4–6 weeks

**What's live:**
- Real VIT club data (manually entered by you on web portal)
- Student login via college Google ID (`@vit.edu` email)
- Event discovery, RSVP, digital gate passes
- Attendance scanning (for select club events as pilot)
- Observer access for 1–2 VIT faculty advisors

**What's NOT in V1:**
- Multi-college support (hard-coded to VIT_PUNE)
- Play Store listing
- Push notifications

**Success criteria (define "smooth"):**
| Metric | Target |
|---|---|
| Daily Active Users | ≥ 40% of registered users open app daily |
| Crash rate | < 1 crash per 100 sessions |
| Attendance scans | At least 2 live events fully scanned via app |
| Observer feedback | At least 1 faculty confirms it's useful |
| Student retention | ≥ 60% still using after 2 weeks |

---

### 🟡 V2 — VIT Full Public Launch
**Who:** All VIT students (open, no invite needed)  
**Platform:** Google Play Store (internal testing → open testing → production)  
**Duration:** 6–8 weeks post V1

**What's new:**
- Play Store listing live
- Push notifications (event reminders, RSVP confirmations)
- All VIT clubs onboarded (via web portal self-service)
- Competitions tab fully live with real data
- Bug fixes from V1 feedback
- App polished, no hardcoded names/data anywhere

**Success criteria:**
| Metric | Target |
|---|---|
| Registered users | 500+ VIT students |
| Events managed | 5+ real events with gate scanning |
| Avg rating (internal) | 4.0+ |
| Observer adoption | 3+ faculty/DSA using it |

> [!IMPORTANT]
> Only move to V3 once these numbers are hit. Don't physically market to other colleges before this — you'll embarrass yourself and kill trust.

---

### 🟠 V3 — Multi-College Pilot (5–6 Pune Colleges)
**Who:** COEP, MIT Pune, Symbiosis, PICT, Cummins, Indira (your choice)  
**Strategy:** Physical marketing + **Campus Ambassador Program**

**The critical thing you haven't planned:**
**Who enters data for other colleges?**  
You can't manually do it for every college. You need:
- A **College Onboarding Flow** on the web portal where a designated College Admin (DSA/Student Council head) self-registers their institution
- **Club Presidents self-onboard** their club via the website
- A basic **content approval queue** so you review before it goes live

**What's new in the app:**
- Multi-college architecture: students see their own college by default, can explore others
- College selector in onboarding (not hardcoded VIT anymore)
- Each college has isolated data (students only see their own club applications)
- App Store listing (iOS)

**Go-to-market:**
1. Email the DSA / Student Council of target colleges
2. Get 1 Campus Ambassador per college (a motivated student, give them free premium features)
3. Ambassador onboards 3–5 clubs at their college
4. You attend 1 major fest at each college with a booth

**Success criteria:**
| Metric | Target |
|---|---|
| Colleges live | 6 |
| Total registered users | 2,000+ |
| Monthly active events | 10+ across colleges |

---

### 🔴 V4 — Maharashtra / Pan-India Scale
Only after V3 is stable.

- CDN for assets, API rate limiting, auto-scaling backend
- Monetization (premium features for clubs: analytics, priority listing, certificate templates)
- Vernacular language support (Marathi)
- College ERP integrations (attendance sync with Moodle etc.)
- Investor deck ready

---

## ⚠️ The Biggest Risk You Haven't Planned For

**Multi-tenancy data isolation.**  
Right now your app uses `collegeId` to filter data, but it's all in the same database. If you don't architect proper row-level security from V0, a VIT student could theoretically see COEP club applications. Fix this at the database layer before V3, not after.

---

## Suggested Tech Stack for Scale (if you haven't locked in yet)

| Layer | Recommendation | Why |
|---|---|---|
| Backend | **Supabase** (PostgreSQL + Auth + Storage) | Built-in row-level security, real-time, free tier for V1 |
| Auth | **Supabase Auth** + Google OAuth | Works with college emails |
| Push notifications | **Expo Notifications** + **OneSignal** | Already in your Expo setup |
| QR scanning | **expo-barcode-scanner** | Native, no extra config |
| Web portal | **Next.js** (already in your repo) | You already have it |
| Deployment | **Vercel** (web) + **EAS** (app) | Already configured in your repo |

---

## Summary Timeline

```
Now          → V0: Fix backend, kill mock data (2–3 weeks)
Oct 2026     → V1: VIT closed beta, 100 users (4–6 weeks)
Dec 2026     → V2: VIT public, Play Store, 500 users
Feb 2027     → V3: 5–6 Pune colleges, 2000 users
Mid 2027     → V4: Pan-India, monetization
```
