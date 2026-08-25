# ClubSync — Pre-Deployment Audit & Feature Roadmap

---

## 🔴 Critical Bugs to Fix Before Deployment

These are real issues found in your actual code that **will break the experience** for real users.

---

### Bug 1 — Hardcoded "Pranav Vasu" identity leaking everywhere

| File | Line | Issue |
|---|---|---|
| [`clubSyncService.ts`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/services/clubSyncService.ts#L23-L38) | 23–38 | `CURRENT_USER` defaults to your personal info |
| [`HomeScreen.tsx`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/screens/HomeScreen.tsx#L289) | 289 | Hardcoded `"unread notices for Pranav Vasu"` |
| [`OnboardingScreen.tsx`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/screens/OnboardingScreen.tsx#L55-L77) | 55–77 | Google Sign-In auto-fills **your** credentials (name, email, PRN) |
| [`mockData.ts`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/data/mockData.ts#L1074) | 1074, 1089 | Tickets hardcoded with `attendeeName: 'Pranav Vasu'` |

**Fix:** Replace all hardcoded identity references with `CURRENT_USER.name` dynamically.

---

### Bug 2 — `Math.random()` used for Stats (re-renders = flickering numbers!)

| File | Line | Issue |
|---|---|---|
| [`HomeScreen.tsx`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/screens/HomeScreen.tsx#L97-L98) | 97–98 | `approvedClubsCount` and `openHiringCount` fall back to `Math.random()` |
| [`mockData.ts`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/data/mockData.ts#L197) | 197+ | Every club's `followersCount` is `Math.random()` — changes on every re-render |

**Fix:** Replace `Math.random()` fallbacks with fixed seed values. Numbers change on every scroll — this is unprofessional and confusing.

---

### Bug 3 — Google Sign-In is fake (hardcoded demo)

[`OnboardingScreen.tsx` L48–79](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/screens/OnboardingScreen.tsx#L48-L79) — The `signInWithGoogle()` call auto-fills your personal credentials. Any real user clicking "Continue with Google" will be logged in as you.

**Fix:** Either implement real Google OAuth (via `expo-auth-session`) or hide the button and label it "Demo Mode".

---

### Bug 4 — Search bar on HomeScreen is non-functional

[`HomeScreen.tsx` L134–141](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/screens/HomeScreen.tsx#L134-L141) — The search `TextInput` has no `onChangeText` handler and searches nothing. Users will type and get zero response.

**Fix:** Wire it to filter events and clubs, or remove it before launch.

---

### Bug 5 — `upcomingFestsCount` = total events (not upcoming)

[`HomeScreen.tsx` L99](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/screens/HomeScreen.tsx#L99) — Shows `events.length` with comment `// Will refine later`. This includes past events, giving inflated/wrong numbers.

**Fix:** Filter by `event.status === 'upcoming'`.

---

## 🟡 Pre-Deployment Polish (Makes It Feel Premium)

These aren't crashes but they're what separate a demo from a product.

---

### Polish 1 — Add `SafeAreaView` to all screens

`HomeScreen`, `ClubsScreen`, `CompetitionsScreen`, `EventsScreen` all lack proper `SafeAreaView`. On notch phones (iPhone, Android with cutouts), the header will overlap the status bar.

---

### Polish 2 — Empty States for every list

When filters return 0 results, screens show a blank white space. Add illustrated empty states:
- "No clubs found in this domain 🔍"
- "No competitions match your filters 🏆"
- "No campus events this week 📅"

---

### Polish 3 — Loading skeletons (not spinners)

Currently the app jumps from blank → data instantly (mock data). When you connect real API, there will be a flash. Add skeleton loaders (grey shimmer boxes) for club cards, event cards, and competition cards.

---

### Polish 4 — Pull-to-Refresh

None of the `ScrollView`s have `refreshControl`. Users expect to pull down to refresh data — especially for events and competitions.

---

### Polish 5 — Haptic feedback on key actions

Following a club, RSVP-ing an event, registering for a competition — these all deserve a subtle haptic tap via `expo-haptics`. It makes the app feel alive and responsive.

---

### Polish 6 — App Icon & Splash Screen

The app currently has Expo's default rocket icon. Before deployment you **must** replace it with a ClubSync branded icon in `app.json` (the `icon` and `splash` fields).

---

### Polish 7 — Error boundaries

No screen wraps its content in an error boundary. A single crash in `ClubsScreen` (which is 1788 lines!) will blank the whole app with no recovery path.

---

### Polish 8 — Notifications are 100% static mock

The 4 hardcoded notifications in [`HomeScreen.tsx` L41–74](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/screens/HomeScreen.tsx#L41-L74) are about you specifically (VIT Pune hackathon, your CGPA, your interview). These must be dynamic or removed before public launch.

---

## 🟢 New Features to Add (Ranked by Impact)

---

### Feature 1 ⭐ — **Club Admin / President Dashboard**

Right now club presidents can edit their club in a modal within ClubsScreen. This should be its own dedicated screen/tab with:
- View all applications submitted to their club
- Shortlist / reject applicants with one tap
- Post announcements that appear in followers' notifications
- Schedule new events from within the dashboard

**Impact:** Makes ClubSync a two-sided platform (student + admin), not just a discovery app.

---

### Feature 2 ⭐ — **Application Tracker (My Applications screen)**

The `submitApplication()` service is built in [`clubSyncService.ts`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/mobile/src/services/clubSyncService.ts#L578-L601) but there's no UI to see submitted applications and their status pipeline (Applied → Shortlisted → Interview → Offered). 

Add a Kanban-style tracker inside the Profile tab showing all applications and their live status.

---

### Feature 3 ⭐ — **Event Calendar View**

EventsScreen currently shows a flat list. A monthly calendar view (swipe between months, dots on event days, tap a day to see events) would massively improve usability and make it feel like a real campus OS.

**Library:** `react-native-calendars`

---

### Feature 4 — **Team Formation for Competitions**

When registering for a team competition, users currently type teammate PRNs manually. Add a "Find Teammates" feature:
- Search by PRN or name
- See their skills and branch
- Send a team invite

---

### Feature 5 — **Push Notifications (Real)**

Wire up `expo-notifications` with your Supabase backend to send real push alerts when:
- A club you follow opens recruitment
- Your application status changes
- An event you RSVPd to is in 24 hours

---

### Feature 6 — **Deep Links / QR Club Sharing**

Generate a shareable link / QR code for each club that opens directly to that club's detail page in the app. Club presidents can share these during fests for instant follows.

---

### Feature 7 — **AI Match Score for Competitions**

Score each competition 0–100% based on the user's:
- Interests (from onboarding)
- Branch (Tech competitions → CE/CS students score higher)
- Year (Final year students score higher for B-Plans)

Show a green `87% match` badge on competition cards. This is purely algorithmic — no external API needed.

---

### Feature 8 — **Offline Mode Banner**

Detect network connectivity via `@react-native-community/netinfo`. When offline, show a subtle banner at the top and serve cached data seamlessly (the service layer already has local fallbacks built in!).

---

## 📦 Deployment Checklist

| Item | Status |
|---|---|
| Remove all hardcoded personal data | ❌ Not done |
| Replace `Math.random()` fallbacks | ❌ Not done |
| Fix non-functional search bar | ❌ Not done |
| Fix `upcomingFestsCount` filter | ❌ Not done |
| Add app icon + splash screen | ❌ Not done |
| Configure `.env` with real Supabase URL | ⚠️ Check |
| Set up EAS build (`eas build`) | ⚠️ Ready (eas.json exists) |
| Fix/hide fake Google Sign-In | ❌ Not done |
| Add SafeAreaView to all screens | ❌ Not done |
| Test on physical Android + iOS device | ❌ Not done |
