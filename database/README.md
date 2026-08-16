# ClubSync Database Setup Guide

This database schema is pre-configured for **PostgreSQL** and **Supabase**.

## 🚀 Instant Cloud Setup (Recommended - 2 Minutes)

1. Go to [**Supabase.com**](https://supabase.com) and create a new free project (e.g. `clubsync-prod`).
2. In the Supabase Dashboard, click on **SQL Editor** in the left sidebar.
3. Open [`database/schema.sql`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/database/schema.sql), copy its entire contents, and paste it into the Supabase SQL Editor.
4. Click **Run**.
5. All 12 tables, indexes, views, and initial seed data (VIT clubs, COEP, PICT, roles) will be generated instantly.

---

## 📊 Included Tables & Capabilities:
- **`colleges`**: Multi-college tenancy (VIT Pune, COEP Tech, PICT, MIT-WPU, PCCOE, VIIT).
- **`users`**: Unified student identity, CGPA, branch, year, and role management.
- **`clubs` & `club_roles`**: 75+ clubs across Technical, Cultural, Sports, and Social verticals.
- **`events` & `event_approvals`**: Multi-tier approval pipeline (Mentor ➔ Resource Head ➔ Coordinator ➔ Dean).
- **`tickets` & `event_registrations`**: Tiered ticketing, QR token validation, and day-of-event check-in.
- **`competitions`, `teams` & `winners`**: 2+ year historical archive for Hackathons, Debates, and Sports tournaments.
- **`recruitment_drives` & `applications`**: Core team hiring pipeline with CGPA eligibility checks.
- **`finance_transactions`**: Financial income/expense ledger.
- **Analytical Views**: 
  - `v_college_winner_leaderboard`: Real-time ranking of top-winning colleges.
  - `v_inter_college_participation_stats`: Footfall and origin mapping.
  - `v_club_annual_performance`: Auto-summarizer for Annual Review Form AY 2026–27.
