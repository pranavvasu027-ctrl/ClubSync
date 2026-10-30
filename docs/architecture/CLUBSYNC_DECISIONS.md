# ClubSync — Architecture Decision Log & MVP Reference

**Document Version:** 1.0.0  
**Status:** Living Planning Reference  
**Last Updated:** October 2026  
**Scope:** Web-First MVP Alignment, Role Delegation, and Module Architecture  

---

## 1. Context & Authority

This document serves as the canonical planning reference for the ClubSync architecture, capturing **Confirmed Decisions**, **Recommended Architectural Patterns**, and **Open Questions** requiring product owner determination. 

> [!NOTE]
> Per project directives, if `ClubSync_Architecture_Direction_and_Decisions.md` was not committed as a standalone file in the repository prior to this audit, the confirmed decisions and rules explicitly provided by the project owner establish the authoritative baseline herein. No decisions outside this baseline are treated as final.

---

## 2. Confirmed Architecture Decisions

The following decisions are confirmed and lock the product and technical boundaries for the MVP:

### 2.1 Product Delivery Direction
* **Decision 2.1.1 (Web-First Delivery):** The web application (React, Vite, TypeScript) is the primary and first product to deliver. Mobile app (Expo / React Native) developments are decoupled from the MVP release gate.
* **Decision 2.1.2 (Target Institution Scope):** For the initial launch (V1), the application scope is focused on single-campus operations (VIT Pune). Multi-college browsing features remain disabled behind feature flags and do not impede the web MVP.

### 2.2 Pillar A — Club Discovery & Following
* **Decision 2.2.1 (Authenticated Discovery):** Students must sign in to browse club profiles, club details, announcements, and upcoming events. Public/anonymous browsing is not permitted for the MVP.
* **Decision 2.2.2 (Instant Following):** Following a club is instantaneous and does not require approval from club leadership or faculty.
* **Decision 2.2.3 (Decoupling Follower vs Member):** Following a club represents a social subscription layer and is strictly separate from official club membership (`memberships`). Followers have no internal club operational privileges.
* **Decision 2.2.4 (Granular Notification Preferences):** Students can specify notification preferences per followed club across:
  * Announcements
  * Events
  * Recruitment
  * All updates
* **Decision 2.2.5 (Unfollowing):** Students can unfollow any club at any time without restriction.

### 2.3 Pillar B — Event Modularity & Lifecycle
* **Decision 2.3.1 (Multi-Step Creation & Publication Flow):** Event progression follows a mandatory multi-step sequence:
  1. An authorized club user creates an event proposal (saved as `draft`).
  2. The event is explicitly submitted for faculty review (transitioning to `under_review`).
  3. Faculty approval is **mandatory** before an event can be published to students.
  4. Faculty approval does **not** automatically publish the event; upon approval, status becomes `approved`.
  5. After faculty approval, only the President (or authorized club executive) can publish the event, setting status to `published`.
  6. Faculty approval and event publication are distinct, auditable actions recorded in `event_audit_log` with user ID, timestamp, and metadata.

### 2.4 Pillar C — Recruitment Modularity
* **Decision 2.4.1 (End-to-End Pipeline Scope):** Recruitment is structured as a dedicated operational module supporting:
  * Configurable recruitment drives per club with eligibility parameters (academic year, minimum CGPA, open roles).
  * Application submission by authenticated students.
  * Multi-stage candidate tracking (Application, Screening, Shortlisting, Interviews / Evaluations, Selection decisions, Results publication).
* **Decision 2.4.2 (Separation from Membership):** An accepted recruitment application does not grant active core privileges until formally assigned via role onboarding in the club directory.

### 2.5 Role & Permission Architecture
* **Decision 2.5.1 (Separation of Account Types and Club Roles):** Account types and club roles are structurally decoupled:
  * **Global Account Types:** `STUDENT`, `FACULTY`, `PLATFORM_ADMIN`.
  * **Club-Specific Roles:** `President`, `Secretary`, `Executive`, `Event Coordinator`, `Volunteer` (and custom roles).
* **Decision 2.5.2 (Delegation Hierarchy):** Authority cascades strictly through:
  $$\text{Platform Owner (PLATFORM\_ADMIN)} \longrightarrow \text{Faculty (FACULTY)} \longrightarrow \text{Authorized Club Roles (President / Executives)}$$
* **Decision 2.5.3 (Faculty Purview Scoping):** Faculty permissions and approvals apply **only** within their authorized club scope (supervised clubs) unless an institution-wide administrative remit is explicitly designated.
* **Decision 2.5.4 (Club Role Management Delegation):**
  * Faculty have full authority to create, edit, and assign roles within their supervised clubs.
  * A Club President can create or manage roles **only if explicitly granted permission by Faculty**.
  * **Tripartite Permission Separation:** The authority to (1) **create roles**, (2) **edit roles**, and (3) **assign roles** are three independent permissions.
  * Faculty can independently enable or revoke each of these three permissions for the President.
  * A President can never grant themselves or others permissions beyond what Faculty has delegated.
* **Decision 2.5.5 (Platform Owner Exclusivity):** Platform-wide administrative authority (e.g. creating colleges, registering new clubs, appointing faculty advisors, overriding systemic locks) is reserved exclusively for the Platform Owner (`PLATFORM_ADMIN`).
* **Decision 2.5.6 (Backend Authorization Mandate):** All permission checks must be enforced at the database layer (Row Level Security policies and `SECURITY DEFINER` stored procedures). Client-side UI conditional rendering is an ergonomic enhancement, never a security boundary.

### 2.6 Dashboard Visual & Structural Reference
* **Decision 2.6.1 (Faculty Dashboard Mockup Reference):** The Faculty Dashboard mockup (`docs/prototypes/prototypes/IMP dashboard/faculty_dashboard.html`) is the official visual and UX reference for the web MVP.
* **Decision 2.6.2 (Design System Elements):** The UI uses:
  * Navy sidebar (`#0F2540` / `--navy`) with parchment/light content workspace (`#F7F5EF` / `--parchment`).
  * Tabler icons, clean card elevated borders, and IBM Plex Mono accents for numerical metrics.
  * Real dynamic data queries from Supabase; no hardcoded mockup numbers or `Math.random()` fallbacks.
  * Responsive layouts accommodating desktop, tablet, and mobile web viewports.
* **Decision 2.6.3 (Faculty Navigation Hierarchy):** The standard faculty navigation routes are:
  1. **Dashboard** (Overview & Supervised Club metrics)
  2. **My Clubs** (Purview list & club status)
  3. **Events** (Proposal queue & approvals)
  4. **Members** (Roster & role oversight)
  5. **Recruitment** (Drives, applicants, and selections)
  6. **Finance** (Budgets, grants, and transaction ledger)
  7. **Reports** (Activity logs, NAAC / NBA documentation)
  8. **Role & Permissions** (Delegation matrix & President permission controls)
  9. **Settings** (Account preferences & alerts)

---

## 3. Recommended Technical Patterns (Proposed Architecture)

The following architectural recommendations have been formulated during the codebase audit to resolve technical debt and ensure backward compatibility:

| Area | Current State Issue | Recommended Architecture Pattern |
|---|---|---|
| **Database Schema** | Split between legacy `setup.sql` tables (`club_events`, `club_ledger`, `club_applicants`) and production `schema.sql` tables (`events`, `finance_transactions`, `applications`). | **Standardize on `schema.sql` master tables.** Deprecate legacy table names across all web components. |
| **Auth Linkage** | Supabase Auth generates `auth.users.id`. In `public.users`, primary key is `user_id` (UUID) with `auth_user_id` as foreign key. Web code inconsistently passes `user.id` to foreign keys expecting `user_id`. | **Standardize profile resolution in `AuthContext`:** Provide both `auth_user_id` and `user_id` in context. Ensure RPC functions look up internal `user_id` via `auth.uid()`. |
| **Event State Flow** | Check constraints had multiple variants across patches. `publish_event` requires tickets to be configured. | **Canonical Event Lifecycle:** `draft` $\rightarrow$ `under_review` $\rightarrow$ `approved` $\rightarrow$ `published` $\rightarrow$ `completed` / `cancelled`, with `changes_requested` and `rejected` states. |
| **Faculty Purview** | `clubs.faculty_mentor` is a plain text string (`VARCHAR(150)`), with no relational foreign key linking faculty users to clubs. | **Explicit Supervisor Mapping:** Introduce a normalized relationship via `club_supervisors(club_id, faculty_user_id)` or standardized `memberships(role_id = 'FACULTY_ADVISOR')`. |
| **Tripartite Permissions** | No table or column currently exists to store `can_create_roles`, `can_edit_roles`, `can_assign_roles`. | **Club Permission Delegation Table:** Store club-level delegated privileges: `club_role_delegations(club_id, role_id, can_create_roles, can_edit_roles, can_assign_roles)`. |
| **Follower Preferences** | `club_followers` only records `(follower_id, club_id, user_id, followed_at)`. | **Notification Preferences Column:** Add `notification_preferences TEXT[] DEFAULT '{"all"}'` or discrete boolean flags to `club_followers`. |

---

## 4. Open Decisions (Pending Product Owner Determination)

The following items are not yet finalized in the project decisions log. They are tracked as open questions requiring the product owner's explicit input:

1. **Event Rejection & Resubmission Protocol:**
   * *Option A:* Rejection is terminal. Once rejected, the event cannot be re-opened; a new proposal must be drafted.
   * *Option B (Recommended based on Patch 08):* Rejection allows revision. Faculty can specify "Changes Requested", allowing the President to edit and resubmit without losing event history.
   * *Status:* **OPEN**.

2. **Post-Approval Event Modifications:**
   * *Question:* If a club President modifies crucial event details (venue, date, budget, ticket price) *after* faculty approval but *before* publication, what should happen?
   * *Option A:* Any edit automatically revokes approval and reverts status to `under_review`.
   * *Option B:* Minor edits (banner, descriptive text) are allowed; critical changes (date, venue, budget) trigger re-approval.
   * *Status:* **OPEN**.

3. **Mandatory Ticket Requirement for Publication:**
   * *Question:* Current stored procedure `publish_event` throws an exception if no ticket tier exists in `public.tickets`. Should the MVP enforce ticket inventory creation before publishing, or can free/open campus events be published without ticket tiers?
   * *Status:* **OPEN**.

4. **Multi-Faculty / Co-Advisor Purview:**
   * *Question:* Can a club have more than one faculty advisor (e.g., Department Mentor + Staff Coordinator), and should all advisors have approval power, or is approval single-signoff?
   * *Status:* **OPEN**.

5. **Recruitment Drive Finalization & Onboarding:**
   * *Question:* When an applicant is moved to `ACCEPTED` or `SELECTED`, should the system automatically insert an active row into `memberships`, or does onboarding require a secondary confirmation step by the President/Faculty?
   * *Status:* **OPEN**.

6. **Self-Registration vs Invite-Only for Faculty & President:**
   * *Question:* Currently, the web login screen allows anyone to self-select roles (`Student`, `Recruiter`, `Admin`) at sign-up. In the final MVP, how should Faculty and Presidents be onboarded?
   * *Option A:* All accounts sign up as `STUDENT`; Platform Owner promotes them to `FACULTY` or assigns them as `President`.
   * *Option B:* Whitelisted institutional emails (e.g. `@vit.edu`) auto-assign account types based on an administrative pre-seed roster.
   * *Status:* **OPEN**.
