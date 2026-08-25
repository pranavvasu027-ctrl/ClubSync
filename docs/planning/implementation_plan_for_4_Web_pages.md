# Premium Role-Based Dashboard Pages for ClubSync

Build 4 world-class, role-based web dashboard pages (Faculty, President, Executive, Secretary) with a premium dark-mode design system inspired by Linear, Stripe, Notion, and Vercel.

## Current State

The project currently uses **standalone HTML files** with inline CSS/JS (vanilla), Chart.js for charts, and Tabler Icons. The files are deployed to Vercel as static pages. The database is PostgreSQL on Supabase with a comprehensive schema covering clubs, events, tickets, competitions, recruitment, and finance.

**We will maintain this architecture** — each dashboard will be a self-contained HTML file with all CSS/JS inline, using CDN-hosted libraries. No build tools required. This matches the existing pattern in [`clubsync_dashboard.html`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/clubsync_dashboard.html) and keeps deployment simple.

---

## User Review Required

> [!IMPORTANT]
> **Tech Stack Decision**: The existing project uses standalone HTML files with no framework. This plan builds all 4 dashboards as self-contained HTML files (CSS + JS inline), using CDN libraries. This keeps things consistent and deployable immediately. If you'd prefer React/Next.js instead, please let me know before I begin.

> [!IMPORTANT]
> **Mock Data vs Live Supabase**: The dashboards will ship with realistic mock data and full UI interactivity (animations, drag-drop, modals, etc.) baked in. Supabase integration hooks are left as clearly marked connection points. Want me to wire up live Supabase queries too?

> [!IMPORTANT]
> **Scope Prioritization**: This is an enormous feature set. I'll build all 4 dashboards with the full premium design system (glassmorphism, animations, micro-interactions, command palette, etc.), but some features like sound effects, onboarding tooltips, and real-time presence will be marked as "Phase 2" — ready to activate but not blocking the first build. OK?

---

## Open Questions

> [!NOTE]
> **User Names**: The existing code references "Pranav Vasu" (user) and "Kuldeep" (president in the prompt). Should I use these names in the mock data, or different ones?

> [!NOTE]
> **Club Context**: The dashboards appear to be for VIT Pune's "GedIT Technical Club" based on the seed data. Should all dashboards default to this club context?

---

## Design System (Shared Across All 4 Dashboards)

### Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0A0A0F` | Page background |
| `--bg-card` | `rgba(255,255,255,0.03)` | Glassmorphism cards |
| `--bg-card-hover` | `rgba(255,255,255,0.06)` | Card hover state |
| `--border` | `rgba(255,255,255,0.06)` | Card borders |
| `--text` | `#F1F5F9` | Primary text |
| `--text-muted` | `rgba(255,255,255,0.5)` | Captions, secondary |
| `--accent-gradient` | `#7C3AED → #3B82F6` | Primary buttons/actions |
| `--faculty-accent` | `#3B82F6` (Sapphire) | Faculty role color |
| `--president-accent` | `#EF4444` (Ruby) | President role color |
| `--executive-accent` | `#10B981` (Emerald) | Executive role color |
| `--secretary-accent` | `#F59E0B` (Amber) | Secretary role color |

### Typography (CDN)
- **Inter** (body text) — Google Fonts CDN
- **JetBrains Mono** (numbers/data) — Google Fonts CDN (Geist is not on CDN; JetBrains Mono is the closest widely-available monospace)

### Libraries (All CDN)
| Library | Purpose |
|---------|---------|
| Chart.js 4 | All charts (bar, line, donut, radar) |
| Tabler Icons | Icon system (already used) |
| Animate.css | Entrance animations |
| Canvas Confetti | Confetti burst on approvals |
| SortableJS | Drag-and-drop kanban |

### Common Shell Components (Built Into Each Page)
1. **Collapsible Sidebar** — 260px → 68px icon-only, 300ms spring transition
2. **Command Palette** — Ctrl+K overlay with fuzzy search
3. **Top Bar** — Breadcrumbs + role badge + notifications + quick actions
4. **Toast System** — Top-right slide-in with progress bar
5. **Skeleton Loaders** — Shimmer effect on initial load
6. **Animated Gradient Mesh** — SVG background with slow ambient animation
7. **Dark/Light Mode Toggle** — CSS variables swap with 300ms transition

---

## Proposed Changes

### Shared Design System & Shell

All 4 dashboard files will include the same base design system CSS (~400 lines) and shell JavaScript (~300 lines). To avoid duplication, I'll create a shared CSS file and a shared JS file that each dashboard imports.

#### [NEW] [`clubsync-design-system.css`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/clubsync-design-system.css)
- Complete CSS design system: variables, typography, glassmorphism mixins, animations, skeleton loaders, gradient mesh background, grid system, component styles (buttons, badges, cards, modals, toasts, inputs, tables, kanban, timeline)
- Dark/light mode via `[data-theme]` attribute
- Responsive breakpoints: 1400px, 1024px, 768px

#### [NEW] [`clubsync-shell.js`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/clubsync-shell.js)
- Sidebar collapse/expand logic
- Command palette (Ctrl+K) with fuzzy search
- Notification dropdown with grouped items
- Quick actions dropdown
- Toast notification system
- Theme toggle (dark/light)
- Smooth number counter animation
- Skeleton loader show/hide
- Confetti trigger utility

---

### 1. Faculty Advisor Dashboard

#### [NEW] [`faculty_dashboard.html`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/faculty_dashboard.html)

**Sidebar**: Overview (active), Pending Approvals, All Events, Analytics, NAAC Reports, Activity Log, Settings

**Main Content Sections:**

1. **Hero Stats Bento Grid** (4 glassmorphism cards, 2×2 layout)
   - Total Events (animated counter + sparkline)
   - Pending Approvals (counter + pulse dot)
   - Budget Used (progress ring chart)
   - NAAC Compliance Score (gauge meter)

2. **Pending Approvals Stack** (Linear inbox style)
   - Event cards with poster thumbnail, title, club, date, budget, submitter avatar
   - Approve (green) / Reject (red) buttons with flash animation
   - Expand to see full proposal + attached files
   - Batch multi-select with "Approve All" / "Reject All"
   - Confetti animation on approval

3. **Analytics Dashboard** (Chart.js)
   - Event frequency bar chart
   - Attendance trend line chart
   - Budget allocation donut chart
   - Club comparison radar chart
   - Date range picker (Week / Month / Semester / Custom)
   - AI Insight card with generated summary

4. **NAAC Export Panel**
   - PDF / Excel / CSV export buttons
   - Report preview template
   - Export history table

5. **Activity Timeline**
   - Vertical timeline with filter chips (Club, Action, Date)

---

### 2. Club President Dashboard

#### [NEW] [`president_dashboard.html`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/president_dashboard.html)

**Sidebar**: Dashboard (active), Events, Ledger, Team, Recruitment, Reports, Settings

**Main Content Sections:**

1. **Welcome Hero** — "Good Morning, Kuldeep 👋" + 5 stat bento cards (Active Events, Team Members, Budget Remaining, Pending Tasks, Recruitment Status)

2. **Event Management**
   - "Create Event" → multi-step modal wizard (5 steps: Info, Schedule, Branding, Budget, Review)
   - Event table with toggle to Kanban view (Draft → Submitted → Approved → Live → Completed)
   - Status pills, poster thumbnails, attendee counts, action dropdowns

3. **Ledger & Budget Tracker**
   - Income vs Expense dual bar chart
   - Transaction table with category tags, amounts (green/red), receipt links
   - Add transaction modal
   - Running balance + Budget Health indicator

4. **Team & Permissions Manager**
   - Visual org chart tree (President → Executives → Secretaries → Coordinators)
   - Member cards with role, status, joined date
   - Click → side panel with permission toggle switches
   - "Invite Member" modal with role assignment

5. **Recruitment Pipeline**
   - Kanban board: Applied → Screening → Interview → Selected → Onboarded (SortableJS drag-drop)
   - Applicant cards with skills tags
   - "Finalize Recruitment" button with confetti

6. **Progress Reports**
   - Weekly report cards from team with read receipts (✓✓)

---

### 3. Executive Dashboard

#### [NEW] [`executive_dashboard.html`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/executive_dashboard.html)

**Sidebar**: Dashboard (active), Announcements, Tasks, My Events, Team, Settings

**Main Content Sections:**

1. **Hero** — Greeting + "Today's Focus" top-3 tasks + stats (Announcements Sent, Tasks Done, Upcoming Events)

2. **Announcement Composer**
   - Rich text editor toolbar (bold, italic, headings, bullets, images)
   - Audience selector (multi-select chips)
   - Schedule picker (Now / Later)
   - Preview mode (mobile + web)
   - Sent announcements with read/delivery stats

3. **Task Board (Kanban)**
   - 5 columns: Backlog → To Do → In Progress → Review → Done (SortableJS)
   - Cards: title, assignee avatar, priority flag (🔴🟡🟢), due date, tags
   - Quick-add at top of each column
   - Filter by assignee, priority, date, tag
   - Toggle to list/table view

4. **My Events**
   - Event cards with countdown timer ("3d 14h left")
   - Quick links: View Details, Event Chat, Upload Assets

5. **Team Directory**
   - Grid of member cards with avatar, role, current task, online status
   - Click → assign task side panel

---

### 4. Secretary Dashboard

#### [NEW] [`secretary_dashboard.html`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/Frontend/secretary_dashboard.html)

**Sidebar**: Dashboard (active), Page Editor, Content Calendar, Media Library, Reports, Settings

**Main Content Sections:**

1. **Hero** — Content stats (Pages Updated, Media Uploaded, Pending Reviews) + "Quick Edit Club Page" shortcut

2. **Club Page Editor**
   - WYSIWYG block editor with drag-and-drop sections (About, Gallery, Achievements, Team, Contact, Social)
   - Split-screen: editor left, live preview right
   - Version history sidebar with "Restore" buttons
   - SEO preview card

3. **Content Calendar**
   - Monthly calendar (Google Calendar style)
   - Color-coded items: Social Post (blue), Event (red), Deadline (orange), Meeting (green)
   - Click date → add content modal
   - Drag to reschedule events

4. **Media Library**
   - Grid gallery with lazy-loading blur-up
   - Drag-and-drop upload zone with progress bar
   - Filter by type, date, event, tags
   - Lightbox preview with download/share/delete

5. **Progress Report Submission**
   - Weekly form: Completed, In Progress, Blockers, Plan
   - Rich text + file attachments
   - History with "Viewed by President" receipt

---

### Deployment Configuration

#### [MODIFY] [`vercel.json`](file:///c:/Users/prana/OneDrive/Desktop/Clubsync/vercel.json)

Add routes for the 4 new dashboards:
```diff
  { "source": "/dashboard", "destination": "/Frontend/clubsync_dashboard.html" },
+ { "source": "/faculty", "destination": "/Frontend/faculty_dashboard.html" },
+ { "source": "/president", "destination": "/Frontend/president_dashboard.html" },
+ { "source": "/executive", "destination": "/Frontend/executive_dashboard.html" },
+ { "source": "/secretary", "destination": "/Frontend/secretary_dashboard.html" },
```

---

## File Summary

| # | File | Type | Description |
|---|------|------|-------------|
| 1 | `Frontend/clubsync-design-system.css` | NEW | Shared premium design system |
| 2 | `Frontend/clubsync-shell.js` | NEW | Shared shell components (sidebar, command palette, toasts, etc.) |
| 3 | `Frontend/faculty_dashboard.html` | NEW | Faculty Advisor dashboard (Level 6) |
| 4 | `Frontend/president_dashboard.html` | NEW | Club President dashboard (Level 5) |
| 5 | `Frontend/executive_dashboard.html` | NEW | Executive dashboard (Level 4) |
| 6 | `Frontend/secretary_dashboard.html` | NEW | Secretary dashboard (Level 4) |
| 7 | `vercel.json` | MODIFY | Add routes for new dashboards |

Total: **6 new files + 1 modified file**

---

## Verification Plan

### Manual Verification
- Open each dashboard HTML file in a browser directly to verify:
  1. ✅ Dark mode renders correctly with gradient mesh background
  2. ✅ Glassmorphism cards render with proper blur/borders
  3. ✅ Sidebar collapses/expands smoothly
  4. ✅ Command palette opens with Ctrl+K
  5. ✅ All Chart.js charts render correctly
  6. ✅ Kanban drag-and-drop works (President & Executive)
  7. ✅ Multi-step modals navigate correctly
  8. ✅ Toast notifications appear on actions
  9. ✅ Confetti fires on approval actions
  10. ✅ Counter animations run on page load
  11. ✅ Skeleton loaders show briefly on load
  12. ✅ Dark/light mode toggle works
  13. ✅ Responsive layout at 1024px and 768px breakpoints

### Build Verification
- No build step needed (static HTML files)
- Verify Vercel routing with updated `vercel.json`

---

## Execution Order

1. `clubsync-design-system.css` (shared foundation)
2. `clubsync-shell.js` (shared interactivity)
3. `faculty_dashboard.html` (most complex — sets the pattern)
4. `president_dashboard.html`
5. `executive_dashboard.html`
6. `secretary_dashboard.html`
7. `vercel.json` update
