# V1 Scoping: Strip Multi-College Features (VIT-Only)

## Philosophy
**Hide, don't delete.** We will use a single feature flag (`MULTI_COLLEGE_ENABLED = false`) in a config file. All multi-college UI will be wrapped behind this flag so you can flip it to `true` in V2/V3 and everything comes back instantly — zero re-coding.

---

## Step 0: Create a Feature Flag File

#### [NEW] `src/config/featureFlags.ts`
```typescript
// Feature Flags — V1: VIT Pune Only
// Flip these to true when expanding to multi-college in V2/V3
export const MULTI_COLLEGE_ENABLED = false;
export const DEFAULT_COLLEGE_ID = 'VIT_PUNE';
export const DEFAULT_COLLEGE_NAME = 'Vishwakarma Institute of Technology, Pune';
```

This is the single source of truth. Every multi-college feature reads from here.

---

## What to Remove (7 Changes, Priority Order)

### 1. HomeScreen — College Switcher Chips

**What it is:** The horizontal scrollable bar of college chips (IIT Bombay, BITS Pilani, COEP, etc.) at the top of the Home screen.

**Why remove:** Misleading for V1 — tapping another college shows zero data and confuses users.

**How:**
- Wrap the `<View style={styles.collegeSelectorContainer}>` block (lines 152–167) inside `{MULTI_COLLEGE_ENABLED && ( ... )}`.
- The header already shows `CURRENT_USER.collegeName` as a static badge — that stays as the college indicator.

**Impact on UI:** Clean. The stats grid moves up slightly. App feels focused and intentional.

---

### 2. ClubsScreen — College Browsing Bar + Cross-College Warnings

**What it is:** Another horizontal college chip bar, plus warning strips like *"Browsing COEP · Read-only"*, cross-college banners in club detail modals, and empty-state fallbacks for non-VIT colleges.

**Why remove:** There are zero clubs from other colleges in mock data. The empty states and warnings just look broken.

**How:**
- Wrap the college selector (lines 199–219) in `{MULTI_COLLEGE_ENABLED && ( ... )}`.
- Wrap the cross-college notice strip (lines 221–229) in `{MULTI_COLLEGE_ENABLED && !isHomeCollege && ( ... )}`.
- Wrap the modal cross-college banner (lines 453–462) similarly.
- Remove `browsingCollegeId` state — hardcode filtering to `CURRENT_USER.collegeId`.

**Impact on UI:** The Clubs screen loads instantly with all VIT clubs. No confusing empty states.

---

### 3. OnboardingScreen — Multi-College Picker (Step 1)

**What it is:** The *"Find your college"* screen where users search through 10 colleges.

**Why remove:** For V1, every user is from VIT. Asking them to search and select VIT is unnecessary friction in the onboarding flow.

**How:**
- When `MULTI_COLLEGE_ENABLED === false`, auto-select VIT Pune and skip Step 1 entirely (jump to Step 2: Branch/Year selection).
- Change the brand header from *"ClubSync National"* to *"ClubSync VIT"*.
- Change the subtext from *"Join 45,000+ students across India"* to *"Your VIT Pune campus companion"*.

**Impact on UI:** Onboarding becomes 1 step shorter. Feels snappy and purpose-built for VIT.

---

### 4. EventsScreen — Cross-College Event Merging

**What it is:** The `COMPETITIONS` array (from other colleges) is merged into the Events feed, and a filter checks `collegeName !== CURRENT_USER.collegeName`.

**Why remove:** For V1, all events should be VIT-hosted. Showing *"IIT Bombay"* or *"National"* events with no real data behind them looks fake.

**How:**
- When `MULTI_COLLEGE_ENABLED === false`, skip the `COMPETITIONS` merge entirely — only show `initialEvents` (which are all VIT events).
- Remove the `collegeName` filter check (it becomes redundant).
- On event cards, hide `· {evt.collegeName}` from the subtitle since it's always VIT.

**Impact on UI:** Cleaner event cards. No ghost competitions from other colleges.

---

### 5. App.tsx — selectedCollege State

**What it is:** `selectedCollege` state + `onSelectCollege` prop passed to HomeScreen.

**Why remove:** With the college switcher hidden, this state serves no purpose.

**How:**
- When `MULTI_COLLEGE_ENABLED === false`, don't pass `selectedCollege` / `onSelectCollege` to HomeScreen.
- Make those props optional in the HomeScreen interface.

**Impact on UI:** None — purely internal cleanup.

---

### 6. Mock Data — Scopes & Descriptions

**What it is:** Events have scopes like `'Inter-Collegiate'`, `'City-Wide'`, `'National'` and descriptions mentioning *"COEP, PICT, MIT-WPU"*.

**Why update:** A VIT student seeing *"16 teams from COEP, PICT, VIT clash..."* for a VIT-only app is confusing.

**How:**
- Change all event `scope` values to `'Intra-Collegiate'` or `'Campus'`.
- Update descriptions to remove other college names (e.g., *"16 top debating teams from across VIT clash..."*).
- In `COLLEGES` array, keep only `VIT_PUNE` entry.

> [!TIP]
> Don't delete the other 9 colleges — just comment them out with `// V2: Re-enable for multi-college`.

**Impact on UI:** Events feel authentic and VIT-specific.

---

### 7. ProfileScreen — Editable College Field

**What it is:** User can edit their "College / Institute Name" in profile settings.

**Why remove:** For V1, every user is VIT. Letting them type *"MIT-WPU"* breaks data integrity.

**How:**
- When `MULTI_COLLEGE_ENABLED === false`, make the college field read-only (non-editable, greyed out, showing "VIT Pune").

**Impact on UI:** Subtle. Profile still looks complete, just can't change the college.

---

## What to KEEP (My Opinion)

| Feature | Keep? | Why |
|---|---|---|
| `collegeName` in data models | ✅ Yes | Schema stays multi-tenant ready for V2 |
| `collegeId` filtering in services | ✅ Yes | Already scoped to VIT_PUNE, no harm |
| Observer role logic | ✅ Yes | Upper hierarchy still needs it at VIT |
| Scope field on EventItem | ✅ Yes | Keep the field, just default to 'Campus' |
| Hackathon banner on Home | ✅ Yes | Change text from "Inter-College" → "VIT Grand Hackathon" |
| Notification about leaderboard | ⚠️ Update | Change from "Maharashtra rank" to "VIT Internal Stats" |

---

## Verification Plan

### Automated
- Run `npx tsc --noEmit` after all changes to ensure zero compilation errors.

### Manual
- Walk through every screen and confirm:
  - No mention of IIT Bombay, COEP, PICT, BITS, etc.
  - No college switcher bars visible anywhere
  - Onboarding skips college selection
  - All events show as VIT-hosted
  - Profile college field is read-only
