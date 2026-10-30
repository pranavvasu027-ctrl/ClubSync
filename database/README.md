# 🏛️ ClubSync Database Setup Guide (Supabase & PostgreSQL)

The ClubSync database is powered by **PostgreSQL** and fully integrated with **Supabase**.

---

## ⚡ Setup Instructions (Supabase)

### Fresh Setup (New Supabase Project)

1. Navigate to [**Supabase Dashboard**](https://supabase.com/dashboard) and log in.
2. Select your project (or create a new project: `clubsync-prod`).
3. Click on the **SQL Editor** tab (`>_`) in the left navigation sidebar.
4. **Step 1 — Schema:** Click **New Query**, copy the entire contents of `schema.sql`, paste it, and click **Run** (`Ctrl + Enter`). This creates all tables, indexes, RLS policies, views, storage buckets, and seed data.
5. **Step 2 — Demo Data (Optional):** Run `seed.sql` to insert additional VIT Pune test users, clubs, and events for development.

> **Note:** `schema.sql` already includes essential seed data (nationwide colleges, core clubs, initial events, and competitions). Only run `seed.sql` if you need additional test accounts.

### Existing Supabase Project

If your Supabase project already has the schema deployed, you do **NOT** need to re-run `schema.sql`. The schema uses `CREATE TABLE IF NOT EXISTS` and `ON CONFLICT` clauses to be safe for re-runs, but always back up your data first.

---

## 📁 Files in This Directory

| File | Purpose |
|---|---|
| `schema.sql` | **Master schema** — Creates all tables, indexes, RLS policies, analytical views, storage buckets, realtime config, and initial seed data. This is the single source of truth. |
| `seed.sql` | **Development seed data** — Inserts VIT Pune test users (President, Faculty, Student) and sample clubs/events for local development. Safe to run repeatedly (`ON CONFLICT DO NOTHING`). |
| `rls_policies.sql` | **Legacy RLS policies** — Contains the original V1 role-based security policies for the old `setup.sql` schema (Secretary, Executive, President, Faculty, Owner roles). The current production RLS policies are embedded directly in `schema.sql` Section 11. This file is preserved as reference for the legacy role model. |
| `README.md` | This file. |

---

## 🔑 Environment Keys Configuration

### Mobile App (`mobile/.env`)
```env
EXPO_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-publishable-key>
```

### Web Dashboard (`web/.env`)
```env
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-publishable-key>
```

---

## 📊 Database Architecture Overview

| Table | Description |
|---|---|
| `colleges` | Nationwide multi-tenancy roots (IITs, NITs, BITS, VIT, COEP, PICT, etc.) |
| `users` | Student passport profile, branch, year, CGPA, links, and Google OAuth ID |
| `clubs` | Clubs with CMS edit support for tagline, mentor, vision, deadlines, Instagram |
| `club_roles` | Standardized club roles with hierarchy ranking |
| `memberships` | User-club membership assignments with academic year tracking |
| `club_followers` | Real-time social layer tracking student club subscriptions |
| `events` | Campus events & hackathons with ticket prices, venue, and approval status |
| `event_approvals` | Multi-tier approval pipeline (Mentor → Incharge → Coordinator → Dean) |
| `event_teams` | Event organizing committee member assignments |
| `event_tasks` | Event planning task assignments with priority and status |
| `event_budgets` | Event budget line items with estimated vs actual amounts |
| `event_feedback` | Post-event ratings and comments from attendees |
| `tickets` | Tiered ticket inventory (Free, Early Bird, All-Access Hackathon Pass) |
| `event_registrations` | Live RSVPs, payment status, and cryptographic QR gate pass tokens |
| `competitions` | National hackathons, B-Plans, Case Studies, and CTFs discovery feed |
| `teams` & `team_members` | Inter-college team registrations with teammate PRN validation |
| `winners` | Hall of fame archive with podium ranks and verified certificate codes |
| `recruitment_drives` & `applications` | Core team hiring pipeline with CGPA eligibility checks & status tracker |
| `interview_evaluations` | Interviewer scores and remarks for recruitment applications |
| `notifications` | In-app alerts for ticket passes, interview calls, and college notices |
| `finance_transactions` | Financial income/expense ledger for club operations |

---

## 📈 Real-Time Analytical Views

- **`v_college_winner_leaderboard`**: Live ranking of top-winning colleges and total prize money.
- **`v_inter_college_participation_stats`**: Footfall and origin mapping across academic years.

---

## 🔒 Row Level Security (RLS)

RLS is enabled on **all tables**. The current policy model (defined in `schema.sql` Section 11):

- **Public Read:** Colleges, clubs, events, tickets, competitions, winners, and user profiles are publicly readable for discovery.
- **Self-Management:** Users can only modify their own profile, followers, registrations, applications, teams, and notifications.
- **Club Committee:** Club data can be updated only by active committee members (verified via `memberships` table).
- **Development Policies:** Events, competitions, finance, event teams/tasks/budgets/feedback currently have open write policies for development. These should be tightened before production launch.

---

## 📦 Historical Migration Scripts

The original incremental migration scripts (`02_phase0_...` through `12_fix_...`) that were applied during development have been archived to:

```
unwanted imp files/3_database_old_patches/
```

These are preserved for historical reference. The current `schema.sql` incorporates all their final changes.
