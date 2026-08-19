# 🏛️ ClubSync Database Setup Guide (Supabase & PostgreSQL)

The ClubSync database is powered by **PostgreSQL** and fully integrated with **Supabase**.

---

## ⚡ Instant Cloud Setup (2-Minute Supabase Guide)

1. Navigate to [**Supabase Dashboard**](https://supabase.com/dashboard) and log in.
2. Select your project (or create a new project: `clubsync-prod`).
3. Click on the **SQL Editor** tab (`>_`) in the left navigation sidebar.
4. Click **New Query**, copy the entire contents of [`database/schema.sql`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/database/schema.sql), and paste it into the editor.
5. Click **Run** (or press `Ctrl + Enter`).
6. All 14 tables, RLS policies, analytical views, foreign keys, and nationwide seed data will be initialized instantly.

---

## 🔑 Environment Keys Configuration

In `mobile/.env`, ensure your Supabase keys are configured:

```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-publishable-key>
```

---

## 📊 Database Architecture Overview

| Table | Description |
|---|---|
| `colleges` | Nationwide multi-tenancy roots (IITs, NITs, BITS, VIT, COEP, PICT, etc.) |
| `users` | Student passport profile, branch, year, CGPA, links, and Google OAuth ID |
| `clubs` | 75+ clubs with CMS edit support for tagline, mentor, vision, deadlines, Instagram |
| `club_followers` | Real-time social layer tracking student club subscriptions |
| `events` | Campus events & hackathons with ticket prices, venue, and approval status |
| `event_approvals` | Multi-tier approval pipeline (Mentor ➔ Incharge ➔ Coordinator ➔ Dean) |
| `tickets` | Tiered ticket inventory (Free, Early Bird, All-Access Hackathon Pass) |
| `event_registrations` | Live RSVPs, payment status, and cryptographic QR gate pass tokens |
| `competitions` | National hackathons, B-Plans, Case Studies, and CTFs discovery feed |
| `teams` & `team_members` | Inter-college team registrations with teammate PRN validation |
| `winners` | Hall of fame archive with podium ranks and verified certificate codes |
| `recruitment_drives` & `applications` | Core team hiring pipeline with CGPA eligibility checks & status tracker |
| `notifications` | In-app alerts for ticket passes, interview calls, and college notices |
| `finance_transactions` | Financial income/expense ledger for club annual renewals |

---

## 📈 Real-Time Analytical Views

- **`v_college_winner_leaderboard`**: Live ranking of top-winning colleges and total prize money.
- **`v_inter_college_participation_stats`**: Footfall and origin mapping across academic years.
- **`v_club_annual_performance`**: Auto-summarizer for NAAC & Annual Review Form AY 2026–27.
