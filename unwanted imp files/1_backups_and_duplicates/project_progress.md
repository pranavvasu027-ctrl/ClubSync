# ClubSync — Project Progress & Changelog

This is a living document tracking the development progress, feature additions, and architectural decisions for ClubSync.

## 🚀 Current Status: V1 (VIT-Only Launch) Prep
The app is currently being scoped down and stabilized for an exclusive V1 launch at Vishwakarma Institute of Technology (VIT). The core dual-role architecture (Student vs. Observer) is implemented, and complex multi-college features have been safely hidden behind feature flags to ensure a focused, bug-free initial release.

---

### ✨ Added (New Features & Architecture)
- **Observer Role & Dashboard:** Implemented a secondary read-only role (observer) that bypasses college restrictions to view all data globally. Added a dedicated Observer Dashboard in the Profile screen.
- **Feature Flag System:** Introduced src/config/featureFlags.ts to manage application scopes. Created MULTI_COLLEGE_ENABLED to toggle between V1 (VIT-only) and V3 (National).
- **Unstop-Style Events Hub:** Merged both internal Campus Events and external Competitions into a single, unified EventsScreen. Added top navigation segments (Discover, Applied, Watchlist, Past) and scrollable category chips.
- **QR Attendance Scanner:** Replaced the text-based mock tester with a real, functional expo-camera implementation in the Profile screen for gatekeepers/observers to scan tickets.
- **Supabase Backend Integration:** Connected the app to a live Supabase (PostgreSQL) database. Created `src/lib/supabase.ts` client with auto-refresh tokens and persistent sessions.
- **Real Google OAuth:** Implemented proper Google Sign-In using `expo-auth-session` + `expo-web-browser`. Opens a real browser for Google login, exchanges tokens with Supabase, and creates user profiles automatically via a PostgreSQL trigger.
- **Email/Password Authentication:** Added Sign In and Sign Up flows using `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`. Real error handling (no more fake fallbacks).
- **Email Verification:** After sign up, users receive a verification email from Supabase. They must click the link before they can log in.
- **Forgot Password:** Added a "Forgot Password?" button that calls `supabase.auth.resetPasswordForEmail()` to send a real password reset link to the user's inbox.
- **Database Schema:** Created `public.users` table with Row-Level Security (RLS) policies. Added a PostgreSQL trigger (`on_auth_user_created`) that auto-creates a profile row when a new user signs up.

### 🗑️ Removed / Hidden (Scoped out for V1)
- **Club Committee Edit Tools:** Completely removed the 'President Edit Mode' (modals, toggles, edit states) from the mobile app. All club management is now strictly delegated to the web platform.
- **Multi-College UI (Hidden):** Hid the college switcher chips on the Home and Clubs screens behind the feature flag.
- **Cross-College Registration Blocks:** Removed empty-state fallbacks, cross-college warning strips, and application blockers since all users and clubs are now strictly VIT.
- **Multi-College Onboarding (Hidden):** Step 1 of onboarding now bypasses the college search list and auto-assigns the user to VIT Pune.
- **Competitions Screen:** Deleted CompetitionsScreen.tsx entirely, as its data is now integrated into the unified Events Hub.
- **Observer Demo Button:** Removed the hardcoded "Continue as Observer" button. Observer role is now auto-detected from the database based on the user's email.
- **Mock Auth Fallbacks:** Removed all fake `return { success: true }` fallbacks from authService. Errors are now real and surfaced to the user.

### 🔄 Refactored / Changed
- **Profile Editing:** Locked the 'College / Institute Name' input field in the Profile editor to prevent data corruption during the VIT-only phase.
- **Mock Data Normalization:** Updated event scopes from 'National'/'Inter-Collegiate' to 'Intra-Collegiate' and removed external college references from descriptions to fit the VIT narrative.
- **TypeScript Stability:** Resolved all lingering strict-mode compilation errors, including orphaned states and duplicate styles.
- **Login UI Cleanup:** Redesigned the login screen with properly styled Email and Password inputs, a "Forgot Password?" link, and a clean "Create Account" link.

---

## 🚧 Next Steps
- **Google OAuth Setup:** Enable Google as an Auth Provider in Supabase dashboard and configure the Google Cloud Console OAuth consent screen + Client ID.
- **Testing & QA:** Perform end-to-end device testing for Sign Up → Email Verification → Sign In and Google OAuth flows.
- **Web Dashboard:** Convert the Claude-generated HTML dashboards (President, Secretary, Executive) into a Next.js application connected to the same Supabase database.
