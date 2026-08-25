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

### 🗑️ Removed / Hidden (Scoped out for V1)
- **Club Committee Edit Tools:** Completely removed the 'President Edit Mode' (modals, toggles, edit states) from the mobile app. All club management is now strictly delegated to the web platform.
- **Multi-College UI (Hidden):** Hid the college switcher chips on the Home and Clubs screens behind the feature flag.
- **Cross-College Registration Blocks:** Removed empty-state fallbacks, cross-college warning strips, and application blockers since all users and clubs are now strictly VIT.
- **Multi-College Onboarding (Hidden):** Step 1 of onboarding now bypasses the college search list and auto-assigns the user to VIT Pune.
- **Competitions Screen:** Deleted CompetitionsScreen.tsx entirely, as its data is now integrated into the unified Events Hub.

### 🔄 Refactored / Changed
- **Profile Editing:** Locked the 'College / Institute Name' input field in the Profile editor to prevent data corruption during the VIT-only phase.
- **Mock Data Normalization:** Updated event scopes from 'National'/'Inter-Collegiate' to 'Intra-Collegiate' and removed external college references from descriptions to fit the VIT narrative.
- **TypeScript Stability:** Resolved all lingering strict-mode compilation errors, including orphaned states and duplicate styles.

---

## 🚧 Next Steps
- **Backend Integration Strategy:** Transition from mockData.ts to a live database (Supabase/Firebase) implementing Row-Level Security (RLS) to enforce multi-tenancy tenant isolation.
- **Testing & QA:** Perform end-to-end device testing for the Observer vs. Student flows.
