# Premium Role-Based Dashboards — 6-Part Build Plan

## Current State

The project uses **standalone HTML files** with inline CSS/JS, Chart.js, Tabler Icons via CDN. Deployed to Vercel as static pages. Database is PostgreSQL on Supabase (14 tables, RLS). **We maintain this architecture** — no build tools needed.

---

## Part 1 of 6 — Design System Foundation

#### [NEW] [`Frontend/clubsync-design-system.css`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/clubsync-design-system.css)

The shared visual foundation that all 4 dashboards import. Sets the premium tone for everything.

**What gets built:**
- CSS custom properties (dark/light theme tokens)
- Background: `#0A0A0F` charcoal + animated SVG gradient mesh (slow ambient purple-blue movement)
- Noise/grain texture overlay (like Linear/Vercel)
- Typography: Inter (body) + JetBrains Mono (data/numbers) via Google Fonts
- Glassmorphism card system (`backdrop-filter: blur(16px)`, `rgba` borders, inner glow)
- Role-specific accent colors: Faculty=Sapphire, President=Ruby, Executive=Emerald, Secretary=Amber
- 8px grid spacing system, max-width 1200px centered layout
- Bento grid layout classes (2×2, 3-col, 4-col responsive)
- Component styles: buttons (gradient + press-down spring effect), badges/pills (role-colored glow), inputs, dropdowns, modals, tables, toggles, progress bars/rings
- Skeleton shimmer loader (YouTube/LinkedIn style)
- Hover states: cards lift with shadow scaling, buttons press-down
- Animations: fade+slide-up entrance (200ms), count-up counters, pulse dots
- Toast notification styles (slide-in from top-right with progress bar)
- Empty state & error state card styles
- Responsive breakpoints: 1400px, 1024px, 768px
- Dark ↔ Light mode via `[data-theme]` attribute swap (300ms transition)
- Print media query styles

**Testable output:** Open any HTML file that imports this CSS — dark background, gradient mesh, fonts load, glassmorphism cards render.

---

## Part 2 of 6 — Shared Shell & Interactivity Engine

#### [NEW] [`Frontend/clubsync-shell.js`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/clubsync-shell.js)

The shared JavaScript powering all interactive components across all 4 dashboards.

**What gets built:**

| Component | Details |
|-----------|---------|
| **Collapsible Sidebar** | 260px → 68px icon-only, 300ms spring transition, grouped nav (Overview, Events, Team, Reports, Settings), active link with gradient left-border, keyboard shortcut hints |
| **Command Palette** | Ctrl+K / ⌘K full-screen overlay, fuzzy search across events/members/announcements, recent searches, suggested actions |
| **Top Bar** | Breadcrumb navigation, role badge (pill with glow), notification bell with red dot + grouped dropdown (Today / Earlier), Quick Action `+` button dropdown |
| **Toast System** | `showToast(message, type)` — slides in top-right, auto-dismiss with progress bar, types: success/error/warning/info |
| **Skeleton Loader** | `showSkeletons()` / `hideSkeletons()` — shimmer effect on data sections, auto-hides after 800ms |
| **Number Counter** | `animateCounter(element, target, duration)` — smooth count-up for stats/KPIs |
| **Confetti** | `fireConfetti()` — burst animation using canvas-confetti CDN (triggers on approve/finalize) |
| **Theme Toggle** | Dark ↔ Light swap with 300ms CSS transition, persists to localStorage |
| **Activity Feed** | Toggle-able sidebar showing live updates ("Sarthak created an event 2m ago") |
| **Modal System** | `openModal(id)` / `closeModal(id)` — backdrop blur, fade-in, escape-to-close |

**Testable output:** Create a minimal test page — sidebar collapses, Ctrl+K opens palette, toasts fire, counters animate, confetti bursts.

---

## Part 3 of 6 — 🟦 Faculty Advisor Dashboard (Level 6)

#### [NEW] [`Frontend/faculty_dashboard.html`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/faculty_dashboard.html)

**Sidebar nav:** Overview • Pending Approvals • All Events • Analytics • NAAC Reports • Activity Log • Settings

**Sections:**

1. **Hero Stats Bento Grid** (4 glassmorphism cards, 2×2)
   - Total Events (counter + 7-day sparkline)
   - Pending Approvals (counter + animated pulse dot)
   - Budget Used (SVG progress ring)
   - NAAC Compliance Score (gauge meter)

2. **Pending Approvals Inbox** (Linear-style stacked cards)
   - Event poster thumbnail, title, club name, date, budget, submitter avatar
   - ✅ Approve (green flash) / ❌ Reject (red flash) buttons
   - Expand card → full proposal with file attachment previews
   - Batch multi-select with "Approve All" / "Reject All"
   - 🎉 Confetti burst on approval

3. **Analytics Dashboard** (Chart.js)
   - Event frequency bar chart
   - Attendance trend line chart
   - Budget allocation donut chart
   - Club comparison radar chart
   - Date range picker: Week / Month / Semester / Custom
   - "AI Insight" card: "Event attendance ↑23% this month. Top club: Tech Club."

4. **NAAC Export Panel**
   - One-click export buttons: PDF / Excel / CSV
   - Report preview template
   - Export history log with download links

5. **Activity Timeline**
   - Vertical timeline (GitHub-style) with all club actions
   - Filter by: Club, Action Type, Date Range

**Mock data:** 5 pending events from GedIT, EDC, Mélange, TRF, Speakers Arena. 12 months of chart data. 15 timeline entries.

---

## Part 4 of 6 — 🟥 Club President Dashboard (Level 5)

#### [NEW] [`Frontend/president_dashboard.html`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/president_dashboard.html)

**Sidebar nav:** Dashboard • Events • Ledger • Team • Recruitment • Reports • Settings

**Sections:**

1. **Welcome Hero** — "Good Morning, Kuldeep 👋" with time-of-day greeting
   - 5 Bento stat cards: Active Events, Team Members, Budget Remaining (animated bar), Pending Tasks, Recruitment Status

2. **Event Management**
   - "Create Event" → 5-step modal wizard:
     - Step 1: Basic Info (title, description, rich text)
     - Step 2: Date, Time, Venue (calendar picker)
     - Step 3: Branding (poster upload zone, theme colors)
     - Step 4: Budget (itemized table, add/remove rows)
     - Step 5: Review & Submit (summary card + CTA)
   - Event table with Kanban toggle: Draft → Submitted → Approved → Live → Completed
   - Status pills, poster thumbnails, attendee counts, action dropdowns

3. **Ledger & Budget Tracker**
   - Income vs Expense dual bar chart (Chart.js)
   - Transaction table: Date, Description, Category tag, Amount (green ↑ / red ↓), Receipt
   - Add transaction modal with category dropdown
   - Running balance + "Budget Health" indicator (🟢🟡🔴)

4. **Team & Permissions Manager**
   - Visual org chart tree: President → Executives → Secretaries → Coordinators
   - Member cards: avatar, name, role, status badge, joined date
   - Click member → side panel with permission toggle switches
   - "Invite Member" modal with role assignment dropdown

5. **Recruitment Pipeline** (SortableJS Kanban)
   - Columns: Applied → Screening → Interview → Selected → Onboarded
   - Drag-and-drop applicant cards with skills tags, avatar, CGPA badge
   - "Finalize Recruitment" button → confirmation modal + 🎉 confetti

6. **Progress Reports**
   - Weekly report cards from Secretaries & Executives
   - Each: submitted by, date, summary, tasks completed/pending
   - Status: Viewed ✓✓ / Not Viewed ✓ (WhatsApp-style read receipts)

**Mock data:** 8 events across all statuses, 12 team members, 15 transactions, 10 applicants, 4 weekly reports.

---

## Part 5 of 6 — 🟢 Executive Dashboard (Level 4 — Branding/Management)

#### [NEW] [`Frontend/executive_dashboard.html`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/executive_dashboard.html)

**Sidebar nav:** Dashboard • Announcements • Tasks • My Events • Team • Settings

**Sections:**

1. **Hero** — Greeting + "Your Focus Today" (top 3 priority tasks auto-pulled)
   - Stats: Announcements Sent (this week), Tasks Completed, Upcoming Events

2. **Announcement Composer**
   - Rich text editor toolbar (Bold, Italic, H1/H2, Bullets, Image embed)
   - Target audience: multi-select chips (All Members, Specific Teams, Specific Roles)
   - Schedule: Now / Schedule Later (date-time picker)
   - Preview toggle: mobile + web mockup
   - Sent history with delivery/read stats (bar chart per announcement)

3. **Task Board** (SortableJS Kanban)
   - 5 columns: Backlog → To Do → In Progress → Review → Done
   - Drag-and-drop cards: title, assignee avatar, priority flag (🔴🟡🟢), due date, tags
   - Quick-add input at top of each column
   - Filter bar: Assignee, Priority, Due Date, Tag
   - Toggle to list/table view

4. **My Events**
   - Event cards with live countdown timer ("3d 14h 22m left")
   - Quick links: View Details, Event Chat, Upload Assets

5. **Team Directory**
   - Grid of member cards: avatar, name, role, current task, online status dot
   - Click → assign task side panel

**Mock data:** 3 sent announcements, 15 tasks across columns, 4 assigned events, 8 team members.

---

## Part 6 of 6 — 🟡 Secretary Dashboard (Level 4 — Content/Design) + Deployment

#### [NEW] [`Frontend/secretary_dashboard.html`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/secretary_dashboard.html)

**Sidebar nav:** Dashboard • Page Editor • Content Calendar • Media Library • Reports • Settings

**Sections:**

1. **Hero** — Content stats: Pages Updated, Media Uploaded, Pending Reviews + "Quick Edit Club Page" shortcut

2. **Club Page Editor** (Notion-style block editor)
   - Drag-and-drop content blocks: About, Gallery, Achievements, Team, Contact, Social Links
   - Split screen: editor (left) + live preview (right)
   - Version history sidebar with "Restore Previous" buttons
   - SEO preview card (search result mockup)

3. **Content Calendar** (Monthly view)
   - Google Calendar-style grid with color-coded items:
     - 🔵 Social Post, 🔴 Event, 🟠 Deadline, 🟢 Meeting
   - Click date → add content item modal
   - Drag to reschedule

4. **Media Library**
   - Grid gallery with lazy-loading blur-up effect
   - Drag-and-drop upload zone with progress bar
   - Filter: Type (image/video/doc), Date, Event, Tags
   - Click image → lightbox preview with download/share/delete

5. **Progress Report Submission**
   - Weekly form: Completed, In Progress, Blockers, Next Week's Plan
   - Rich text + file attachments
   - Submission history with "Viewed by President ✓✓" receipts

**Mock data:** 6 page blocks, 12 calendar items, 16 media files, 3 submitted reports.

---

#### [MODIFY] [`vercel.json`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/vercel.json)

Add routes for all 4 dashboards:
```diff
  { "source": "/dashboard", "destination": "/Frontend/clubsync_dashboard.html" },
+ { "source": "/faculty", "destination": "/Frontend/faculty_dashboard.html" },
+ { "source": "/president", "destination": "/Frontend/president_dashboard.html" },
+ { "source": "/executive", "destination": "/Frontend/executive_dashboard.html" },
+ { "source": "/secretary", "destination": "/Frontend/secretary_dashboard.html" },
```

---

## Complete File Map

| Part | File | Type | ~Size |
|------|------|------|-------|
| 1 | `Frontend/clubsync-design-system.css` | NEW | ~600 lines |
| 2 | `Frontend/clubsync-shell.js` | NEW | ~500 lines |
| 3 | `Frontend/faculty_dashboard.html` | NEW | ~1200 lines |
| 4 | `Frontend/president_dashboard.html` | NEW | ~1500 lines |
| 5 | `Frontend/executive_dashboard.html` | NEW | ~1200 lines |
| 6 | `Frontend/secretary_dashboard.html` | NEW | ~1300 lines |
| 6 | `vercel.json` | MODIFY | +4 lines |

**Total: 6 new files, 1 modified, ~6,300 lines of premium UI code**

---

## Execution Flow

```
Part 1 ──→ Part 2 ──→ Part 3 ──→ Part 4 ──→ Part 5 ──→ Part 6
 CSS        JS        Faculty   President  Executive  Secretary
 Foundation Engine    Dashboard Dashboard  Dashboard  + Deploy
```

> [!TIP]
> Each part is **independently testable**. After Part 1+2, you can open any dashboard in a browser and the shell works. Each dashboard part adds a complete, functional page.

> [!IMPORTANT]
> **Approve this plan to begin execution.** I'll build Part 1 → Part 6 sequentially, showing you the result after each part. You can request changes at any checkpoint before I move on.
