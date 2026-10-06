# Route 53 Console Overhaul — Requirements & Design

> **Revision note (this iteration).** This design was updated to bake in five resolved decisions
> that close every blocking finding from `design-review.md` (3 MEDIUM + 3 NIT). The resolutions are
> locked and must not be re-litigated. See **Responses to design-review findings** at the end for
> the finding-by-finding disposition.

## Requirements

### Summary
Overhaul the Next.js (App Router, TypeScript) frontend of the Route 53 clone so every
section faithfully matches the real AWS Route 53 console (Cloudscape look-and-feel). This is a
visual-fidelity pass: all `ComingSoon` placeholder pages are replaced with fully built,
console-styled pages, the sidebar is rebuilt with the real grouping/order, the top nav is
rebuilt, Create hosted zone becomes a full page (replacing the modal), and the Dashboard and
Health checks pages are built out. No "Coming soon" text may remain anywhere.

Backend is out of scope. The backend already exposes `created_by` ("Route 53 console") on
`HostedZone`, and `types.ts` already carries `created_by`; nothing in this design requires a backend
change. All new sidebar/placeholder pages are static/mocked and read-only; only hosted zones and
DNS records talk to the API. Existing zone/record CRUD and auth must keep working unchanged.

### Functional Requirements

FR-1 **Top nav** rebuilt as a fixed dark full-width bar: hamburger icon, small AWS/app-square
logo, 3x3 app-launcher grid icon, a wide centered search input (placeholder `Search`, right
`[Alt+S]` hint badge), and a right cluster: CloudShell (`>_`), notifications bell, and an
account/`More ▾` menu. The account menu label displays the logged-in user's `username` and
`account_id` (from the existing `User` type in `frontend/src/lib/types.ts`) and contains a reachable
**Sign out** action calling the existing `logout()`. No hard-coded display name ("First Principles",
"Sourish Das") is used anywhere.

FR-2 **Sidebar** rebuilt with the exact order and grouping:
- Top-level links: Dashboard, Hosted zones, Health checks, Profiles.
- Collapsible group **Global Resolver**: Global resolvers (blue `New` tag), Shared DNS views (`New` tag).
- Collapsible group **VPC Resolver**: VPCs, Inbound endpoints, Outbound endpoints, Rules, Query logging, Outposts.
- Collapsible group **Domains**: Registered domains, Requests.
- Collapsible group **IP-based routing**: CIDR collections.
- Collapsible group **Traffic flow**: Traffic policies, Policy records.
- External-link item **DNS Firewall ↗** (href `#`, no in-app page).
Group headers have a ▼/▶ chevron and collapse. Active link is blue and bold. Every non-external
item routes to a real page.

FR-3 **Hosted zones page** (`/hosted-zones`) matches the console: title `Hosted zones (N)` with
live count; right of title a circular refresh icon, secondary `View details` / `Edit` / `Delete`
(disabled until a row is selected), then primary `Create hosted zone` far right (outlined-orange).
Helper line `Automatic mode is the current search behavior optimized for best filter results.` +
blue link `To change modes go to settings.` Filter input placeholder
`Filter records by property or value`; to its right the real `Pagination` component and a settings
gear. Columns in order: Hosted zone name, Type, Created by, Record count, Description, Hosted zone ID
(name links to detail; radio select enables action buttons). **Only `Hosted zone name` and `Type`
are backend-sortable** (sort indicator shown on those headers); `Created by` is a **non-sortable
plain header** because it is a constant value, and the remaining columns stay as today. Empty state:
centered `No hosted zones`, subtext `There are no hosted zones created for this account.`, plus a
`Create hosted zone` button. `Create hosted zone` navigates to the full create page (not a modal).

FR-4 **Create hosted zone full page** at `/hosted-zones/create` with breadcrumb
`Route 53 > Hosted zones > Create hosted zone`, a `Hosted zone configuration` container, the
`Domain name`, `Description - optional` (256-char live counter), and `Type` radio-card fields
(Public selected by default), a separate `Tags` container, and bottom-right `Cancel` (blue link) +
outlined-orange `Create hosted zone`. Submit calls the existing `api.createZone({name,type,comment})`,
fires the existing success flashbar, and navigates to `/hosted-zones`. Cancel returns to `/hosted-zones`.
All literal UI strings are pinned in **Pinned UI strings** below.

FR-5 **Dashboard** (`/dashboard`) fully built with: title `Route 53 Dashboard` + blue Info; a 2x2
bordered card grid (DNS management + `Create hosted zone` outlined-blue link to create page;
Availability monitoring + `Create health check`; Traffic management + `Create policy`; Domain
registration with red `Error`); a `Register domain` card; a `Notifications` card (refresh, search,
pager, Resource/Status columns, empty `No notifications to display`); a `More resources ↗` card; and
a `Service health` card. All static/mocked, links `href="#"`. The card "Create" links use the
**outlined-blue** variant (`.btn--outline-blue`).

FR-6 **Health checks** (`/health-checks`) fully built: title `Health checks (0)` + blue Info; right
circular refresh + outlined-orange `Create health check`; subtext about monitoring; `Find health
check` search; the real `Pagination` + gear; columns (checkbox) ID, Name, State, Details, Status in
last 24 hours, Actions; empty state centered `No health checks to display.` + `Create health check`
button. Static/mocked.

FR-7 **All other sidebar destinations** are real console-styled pages (header + breadcrumb + table
chrome / empty state or cards), never "Coming soon": Profiles, Global resolvers, Shared DNS views,
VPCs, Inbound endpoints, Outbound endpoints, Rules, Query logging, Outposts, Registered domains
(with the extra buttons and an **unconditional** red access-denied banner — see FR-7a), Requests,
CIDR collections, Traffic policies, Policy records. Exact per-page title, count, filter placeholder,
and columns are pinned in **Per-page table spec** below.

FR-7a **Registered domains access-denied banner** renders **unconditionally** as static mocked
content (no state, no dismiss, no trigger rule): a red `.banner` passed as the `banner` prop with the
exact text `You don't have permission to view registered domains. Contact your administrator.`

FR-8 A reusable **`ConsoleListPage`** wrapper renders the common console chrome (breadcrumb, title +
Info, optional action buttons, helper text, filter input, pager, gear, columns, empty state) so each
placeholder page is a few lines.

FR-9 **ComingSoon removal (repo-wide)**: `ComingSoon.tsx` is deleted, and **every** page that
imports it is rewritten to a real console-styled page — not just the sidebar. The importers are the
six pages `dashboard`, `health-checks`, `traffic-policies`, `resolver`, `profiles`, and
`coming-soon`. The `/coming-soon` route and the `/resolver` route are deleted. After this change a
repo-wide grep over `frontend/src` finds **no** `Coming soon` string and **no** `ComingSoon` import
anywhere. Login/auth must not regress.

### Non-Functional Requirements

NFR-1 Preserve the existing Cloudscape palette and tokens in `globals.css`; add new variants/classes
only by extension, not by rewriting existing rules. **No new color token is introduced** — the
outlined-orange create button reuses the existing `--awsui-orange`, and the outlined-blue dashboard
links reuse the existing `--awsui-blue`.

NFR-2 Behavior-preserving: zone list/search/sort/pagination, zone edit/delete (modals), DNS record
CRUD (RecordModal), and signed-cookie auth continue to work unchanged.

NFR-3 TypeScript must compile and `next build` must succeed with no new errors.

### Acceptance Criteria

1. A repo-wide search over `frontend/src` for `Coming soon`, `coming-soon`, and `ComingSoon`
   returns zero matches — including every importing page (dashboard, health-checks, traffic-policies,
   resolver, profiles, coming-soon), the deleted component, and the deleted `/coming-soon` and
   `/resolver` routes.
2. The sidebar renders the four top-level links, five collapsible groups in the specified order with
   the specified children, the two blue `New` tags, and the `DNS Firewall ↗` external item; each
   group collapses/expands; the active route is blue and bold. The `isActive` helper is exactly
   `pathname === href || (href !== "/" && pathname.startsWith(href + "/"))`.
3. The top nav renders hamburger, logo, app-launcher grid, centered search with `[Alt+S]` badge,
   CloudShell, bell, and an account menu showing `user.username` and `user.account_id` with a working
   Sign out.
4. `/hosted-zones` shows `Hosted zones (N)` with a live count, the refresh icon, the three
   selection-gated secondary buttons, an outlined-orange `Create hosted zone`, the automatic-mode
   helper line, the `Filter records by property or value` input, the real `Pagination` component, a
   gear, and all six columns in order including `Created by`; `Created by` is a plain non-sortable
   header; the empty state matches the specified copy.
5. Clicking `Create hosted zone` navigates to `/hosted-zones/create` (no modal opens).
6. `/hosted-zones/create` renders the configuration container, all three fields with the exact
   pinned helper/placeholder copy, a working `{n}/256` counter, two radio cards (Public
   default-selected), the Tags container, and `Cancel` + outlined-orange `Create hosted zone`;
   submitting creates a zone via `api.createZone`, shows the success flashbar, and lands on
   `/hosted-zones` with the new zone listed.
7. `/dashboard` and `/health-checks` render the full specified layouts with no placeholder text.
8. Every other sidebar item routes to a built console-styled page whose title, count, filter
   placeholder, and column labels match the **Per-page table spec**. Registered domains shows the
   unconditional red access-denied banner with the pinned text.
9. Editing a zone, deleting a zone, and creating/editing/deleting a DNS record still work via their
   modals; logging in and out still work; unauthenticated users still see the bare login page.
10. `next build` (tsc + next build) completes successfully. **There is no `next lint` / ESLint gate**
    (none is configured in the repo and none is added).

### Out of Scope
- Real DNS resolution or any real AWS integration.
- Functional backends for the mocked sidebar sections (resolver, domains, traffic, CIDR, profiles,
   health checks) — these are static/empty.
- Bonus items (BIND import/export, dark mode, keyboard shortcuts, bulk ops).
- Backend schema/endpoint changes (none required).
- Adding ESLint or any `next lint` step (none exists; see Decision 1).
- Reworking the existing zone detail page, RecordModal, EditZoneModal, or ConfirmDeleteModal beyond
   leaving them functional.

### Assumptions
- `api.createZone` accepts `{ name: string; type: string; comment: string }` and returns a
  `HostedZone`; the backend derives `zone_id`, `record_count`, and `created_by` ("Route 53 console").
  Confirmed in `lib/api.ts`, `lib/types.ts`, and `backend/app/schemas.py`.
- `Private hosted zone` is selectable on the create page but needs no VPC association logic (the
  backend only stores `type`), matching the mocked scope.
- Sidebar group collapse state is client-only (React state), not persisted.
- The account menu reads `user.username`/`user.account_id` from `AuthProvider`.

---

## Resolved decisions (locked)

These five decisions are final for this iteration and resolve every blocking design-review finding.

1. **No ESLint / no `next lint` gate.** The frontend has no ESLint configured. Do not add an eslint
   dependency or a `next lint` step. Verification is **only** `npm run build` (tsc + next build) plus
   browser-based visual checks. Every earlier mention of `next lint` is removed from this design.
2. **TopNav account label = real user fields.** Display `user.username` and `user.account_id` from
   the existing `User` type. No "First Principles"/"Sourish Das" string anywhere. Keep a working
   Sign out in the account menu.
3. **Pagination = reuse the real component.** Reuse the existing functional
   `frontend/src/components/Pagination.tsx` everywhere a pager is shown. Do **not** introduce a static
   `‹ 1 ›` pager. For static/empty mocked pages, render the real `Pagination` with `total={0}` and
   `page={1}`. (The component returns `null` when `totalPages <= 1`, so an empty page shows no visible
   pager control — which matches the real console's single-page state and keeps the markup honest
   rather than faking a disabled pager. The gear icon still renders in the toolbar beside it.)
4. **Button color = existing tokens only.** The outlined-orange "Create" buttons reuse the existing
   `--awsui-orange` token already in `globals.css`. Do **not** add a `#ff9900` literal or a
   `--awsui-orange-create` token. Outlined-orange = `background:#fff` + `border:1px solid
   var(--awsui-orange)` + dark bold text (`color: var(--color-text-label); font-weight:700`). Add an
   **outlined-blue** variant (`.btn--outline-blue`) for the dashboard cards reusing the existing
   `--awsui-blue` token.
5. **ComingSoon removed repo-wide.** `ComingSoon` is imported by ~6 page files (dashboard,
   health-checks, traffic-policies, resolver, profiles, coming-soon), not just the sidebar. Replace
   **every** importing page with a real console-styled page, delete the `ComingSoon` component, and
   delete the `/coming-soon` and `/resolver` routes. A repo-wide grep must show no `Coming soon`
   string and no `ComingSoon` import remains.

---

## Design

### Overview
The overhaul is organized around three shared layout primitives — a rebuilt `TopNav`, a rebuilt
data-driven `Sidebar`, and a new `ConsoleListPage` wrapper — plus a full `/hosted-zones/create`
page that supersedes `CreateZoneModal`. Every sidebar destination becomes a thin page that composes
`ConsoleListPage` with a small config object, so the fifteen-odd placeholder pages are each only a
few lines. `globals.css` gains a handful of additive classes (outlined button variants, Info link,
New tag, icon buttons, radio cards, group-collapse chrome, console-page helpers) layered on top of
the existing tokens — with **no new color token**. `ComingSoon` and its `/coming-soon` route are
deleted, and the `/resolver` route is deleted; nothing references them afterward. The existing
hosted-zones list, zone detail, record/zone modals, flashbar, and auth are left behaving exactly as
before.

The stack is **locked**: Next.js App Router + React + TypeScript on the frontend, plain CSS in
`globals.css` (no new CSS framework or component library), existing `fetch`-based `api.ts` client,
FastAPI + SQLite backend unchanged. No new runtime dependencies and no new dev dependencies
(no ESLint) are introduced; all icons are inline SVG (matching the current `TopNav`/hosted-zones
pattern). Verification is `npm run build` plus manual/browser visual checks only.

### Route tree
All paths are under `c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\app`.

Existing routes that **change** (all six current `ComingSoon` importers are rewritten):
- `dashboard/page.tsx` — replace `ComingSoon` with the full Dashboard.
- `health-checks/page.tsx` — replace `ComingSoon` with the full Health checks page.
- `profiles/page.tsx` — replace `ComingSoon` with a `ConsoleListPage` (Profiles).
- `traffic-policies/page.tsx` — replace `ComingSoon` with a `ConsoleListPage` (Traffic policies).
- `hosted-zones/page.tsx` — remove `CreateZoneModal` usage; `Create hosted zone` buttons become
  links to `/hosted-zones/create`; add the `Created by` column (plain, non-sortable), the
  automatic-mode helper line, the refresh/gear icon buttons, the exact filter placeholder + empty-state
  copy, and keep the existing real `Pagination`.
- `resolver/page.tsx` — **route removed** (replaced by the granular resolver routes below). Delete
  the `resolver/` folder; it is a `ComingSoon` importer.
- `coming-soon/page.tsx` — **route removed** (delete the `coming-soon/` folder); it is a
  `ComingSoon` importer.

Existing routes **unchanged**: `page.tsx` (root redirect), `login/page.tsx`,
`hosted-zones/[id]/page.tsx`.

New routes to **add** (each `page.tsx`):
- `hosted-zones/create/page.tsx` — full Create hosted zone page.
- `global-resolvers/page.tsx` — "Global resolvers".
- `shared-dns-views/page.tsx` — "Shared DNS views".
- `vpcs/page.tsx` — "VPCs".
- `inbound-endpoints/page.tsx` — "Inbound endpoints".
- `outbound-endpoints/page.tsx` — "Outbound endpoints".
- `rules/page.tsx` — "Rules".
- `query-logging/page.tsx` — "Query logging".
- `outposts/page.tsx` — "Outposts".
- `registered-domains/page.tsx` — "Registered domains" (extra buttons + unconditional access-denied banner).
- `requests/page.tsx` — "Requests".
- `cidr-collections/page.tsx` — "CIDR collections".
- `policy-records/page.tsx` — "Policy records".

Note: Traffic policies keeps its existing `/traffic-policies` path; Policy records uses the new
`/policy-records`. The sidebar maps each label to exactly one of these paths. `DNS Firewall` maps to
`href="#"` with `external: true` and does not get a route.

### Pinned UI strings (create hosted zone full page)

These literals are exact and must appear verbatim.

- **Container title:** `Hosted zone configuration`
- **Container subtext:** `A hosted zone is a container that holds information about how you want to route traffic for a domain, such as example.com, and its subdomains.`
- **Domain name helper:** `This is the name of the domain that you want to route traffic for.`
- **Domain name input placeholder:** `example.com`
- **Valid-chars hint (exact):** `Valid characters: a-z, 0-9, ! " # $ % & ' ( ) * + , - / : ; < = > ? @ [ \ ] ^ _ \` { | } . ~`
- **Description helper:** `This value lets you distinguish hosted zones that have the same name.`
- **Description textarea placeholder:** `The hosted zone is used for...`
- **Description live counter (exact, `{n}` = current length):** `The description can have up to 256 characters. {n}/256`, with `maxLength={256}` on the textarea.
- **Type helper:** `The type indicates whether you want to route traffic on the internet or in an Amazon VPC.`
- **Type radio card 1 (default selected):** title `Public hosted zone`, desc `A public hosted zone determines how traffic is routed on the internet.`
- **Type radio card 2:** title `Private hosted zone`, desc `A private hosted zone determines how traffic is routed within an Amazon VPC.`
- **Tags container subtext:** `Apply tags to hosted zones to help organize and identify them.`
- **Tags empty text:** `No tags associated with the resource.`
- **Tags button:** `Add new tag` (visual-only no-op — see note below)
- **Tags count text (static):** `You can add up to 50 more tags.`

Tags note (resolves NIT 5): `Add new tag` is **visual-only** — its `onClick` is a no-op and the count
text stays `You can add up to 50 more tags.` statically. No tag list state is added in this scope.

Description placeholder note (resolves NIT 6): the create-page textarea placeholder
`The hosted zone is used for...` **intentionally differs** from the old `CreateZoneModal` placeholder
(`Any comments about this hosted zone`). This is a deliberate copy change to match the real console,
not a regression.

### Pinned UI strings (hosted zones list)

- **Title:** `Hosted zones (N)` (N = live count)
- **Helper line:** `Automatic mode is the current search behavior optimized for best filter results.`
  followed by a blue link `To change modes go to settings.`
- **Filter placeholder:** `Filter records by property or value`
- **Empty state:** heading `No hosted zones`, subtext `There are no hosted zones created for this account.`
- **Columns in order:** `Hosted zone name`, `Type`, `Created by`, `Record count`, `Description`,
  `Hosted zone ID`. Backend-sortable: `Hosted zone name` and `Type` only. `Created by` is a plain
  non-sortable header (constant value).
- **Breadcrumb (create page) reuses the existing `{ items: [{ label, href? }] }` API** — no new prop
  shape. Items: `Route 53` (href `/hosted-zones`) → `Hosted zones` (href `/hosted-zones`) →
  `Create hosted zone` (no href, current).

### Per-page table spec (resolves Finding 3)

Each row is a `ConsoleListPage` config. All counts are `0`, all bodies render the empty state, and the
toolbar renders the pinned filter placeholder, the real `Pagination` (total 0), and the gear. The
breadcrumb for each is `Route 53 > {Title}` unless noted.

| Page / route | Title (count) | Filter placeholder | Columns (in order) |
|---|---|---|---|
| Profiles `/profiles` | `Profiles (0)` | `Find profiles` | Name, ID, Status, Created |
| Global resolvers `/global-resolvers` | `Global resolvers (0)` | `Find global resolvers` | Name, ID, Status, Region, Created |
| Shared DNS views `/shared-dns-views` | `Shared DNS views (0)` | `Find shared DNS views` | Name, ID, Owner, Status, Created |
| VPCs `/vpcs` | `VPCs (0)` | `Find VPCs` | VPC ID, Name, Region |
| Inbound endpoints `/inbound-endpoints` | `Inbound endpoints (0)` | `Find inbound endpoints` | ID, Name, VPC, Status |
| Outbound endpoints `/outbound-endpoints` | `Outbound endpoints (0)` | `Find outbound endpoints` | ID, Name, VPC, Status |
| Rules `/rules` | `Rules (0)` | `Find rules` | Name, ID, Type, Domain |
| Query logging `/query-logging` | `Query logging (0)` | `Find query logging configurations` | ID, Hosted zone, Destination |
| Outposts `/outposts` | `Outposts (0)` | `Find Outposts` | ID, Name, Status |
| Registered domains `/registered-domains` | `Registered domains (0)` | `Find domains` | Domain name, Expiration date, Auto-renew |
| Requests `/requests` | `Requests (0)` | `Find requests` | Request ID, Domain name, Operation, Status, Last updated |
| CIDR collections `/cidr-collections` | `CIDR collections (0)` | `Find CIDR collections` | Name, ID, CIDR blocks |
| Traffic policies `/traffic-policies` | `Traffic policies (0)` | `Find traffic policies` | Name, ID, Type, Records, Version |
| Policy records `/policy-records` | `Policy records (0)` | `Find policy records` | Name, Policy, Version, DNS name |

Empty-state copy per page: heading `No {lowercased title without count}` and a generic subtext
`There are no {lowercased title} to display.` (e.g. Profiles → `No profiles` /
`There are no profiles to display.`). Registered domains additionally renders the pinned
access-denied banner (FR-7a) above the toolbar and exposes `Register domain`, `Transfer`, and
`Transfer out` as secondary header actions (visual-only). Traffic policies and Policy records expose
an outlined-orange create action (`Create traffic policy` / `Create policy record`, visual-only).

### Shared components

All component paths are under
`c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\components`.

**`Sidebar.tsx` (rewrite, data-driven).** Replace the current ad-hoc markup with a declared model:

```ts
type NavLink = { label: string; href: string; tag?: "New"; external?: boolean };
type NavGroup = { label: string; items: NavLink[]; defaultOpen?: boolean };

const TOP_LINKS: NavLink[]  // Dashboard, Hosted zones, Health checks, Profiles
const GROUPS: NavGroup[]    // Global Resolver, VPC Resolver, Domains, IP-based routing, Traffic flow
const DNS_FIREWALL: NavLink // { label: "DNS Firewall", href: "#", external: true }
```

The component keeps a `useState<Record<string, boolean>>` of open groups keyed by group label,
seeded from `defaultOpen` (default all open). Group headers render a
`<button className="sidebar__group-header">` with a ▼/▶ chevron and toggle open state. Each item is a
`Link`; `tag === "New"` renders `<span className="sidebar__tag-new">New</span>`; `external` renders a
plain `<a>` with a trailing `↗` and `rel="noreferrer"`. Active detection reuses the existing
`isActive(href)` helper **exactly as it exists today**:
`pathname === href || (href !== "/" && pathname.startsWith(href + "/"))` (resolves NIT 4 — the root
guard `href !== "/"` is preserved; with this helper `Hosted zones` stays highlighted on
`/hosted-zones/create`, which is the desired console behavior). The old `/coming-soon` and
`/resolver` references are gone; every mapped href points at one of the real routes in the route tree.

**`TopNav.tsx` (rewrite).** Keep `useAuth()` for `user`/`logout`. Layout left→right: hamburger
button (`topnav__icon-btn`, inline SVG, non-functional toggle placeholder), existing AWS logo SVG,
app-launcher 3x3 grid button, the centered search block
(`<div className="topnav__search">` with an `<input placeholder="Search">` and a right-aligned
`<span className="topnav__kbd">[Alt+S]</span>`), a `topnav__spacer`, then the right cluster:
CloudShell button (`>_` glyph), bell button, and an account item showing
`{user?.username} @ {user?.account_id} ▾` (real fields only — Decision 2; no hard-coded display
name). The account item opens a small dropdown (`topnav__menu`, client state) containing a
**Sign out** action calling `logout()`. The hamburger, app-launcher, CloudShell, and bell are
visual-only (`href`/handlers no-op). Reachable Sign out preserved.

**`ConsoleListPage.tsx` (new).** Reusable wrapper for FR-7/FR-8 pages. Contract:

```ts
interface ConsoleColumn { label: string }

interface ConsoleAction {
  label: string;
  variant?: "secondary" | "outlined-orange";
  onClick?: () => void;        // omit -> href "#"
  disabled?: boolean;
  dropdown?: boolean;          // renders a trailing ▾
}

interface ConsoleListPageProps {
  breadcrumb: Crumb[];               // reuses Breadcrumb's Crumb type
  title: string;
  count?: number;                    // appends "(N)" to the title when provided
  info?: boolean;                    // renders the blue "Info" link
  description?: string;              // subtext under the title
  actions?: ConsoleAction[];         // right of the title
  showRefresh?: boolean;             // circular refresh icon-button left of actions
  filterPlaceholder?: string;        // search/filter input; omit -> no toolbar search
  columns?: ConsoleColumn[];         // table header; omit -> card-only body
  emptyTitle?: string;               // centered empty-state heading
  emptyText?: string;                // empty-state subtext
  emptyAction?: ConsoleAction;       // button inside the empty state
  banner?: ReactNode;                // optional top banner (e.g. red access-denied)
  showPager?: boolean;               // render the real Pagination (total 0) in the toolbar; default true when columns present
  showGear?: boolean;                // settings-gear icon-button (default true when columns present)
  children?: ReactNode;              // extra content (used by Dashboard-style card bodies)
}
```

Rendering: `Breadcrumb`, optional `banner`, a `page-header` row (title with optional `(N)` and
`Info` link on the left; `showRefresh` icon-button then `actions` on the right), optional
`description`, then a `container-box`. When `columns` is given it renders the toolbar
(filter input + right-aligned **real `Pagination` with `page={1} pageSize={N} total={0}`** + gear), a
`data-table` head, and — since these pages are read-only/empty — the empty state
(`emptyTitle`/`emptyText`/`emptyAction`). Because `Pagination` returns `null` for a single page, the
empty pages show the gear but no visible pager control (Decision 3) — this is intentional and matches
the console's single-page state; no fake/inert pager is rendered. When `columns` is omitted it renders
`children` for card-style pages. `ConsoleAction` with `variant: "outlined-orange"` uses the new
`btn btn--create` class; `"secondary"` uses the existing `btn`.

**`Breadcrumb.tsx` (unchanged).** No API change: it already renders `Crumb[]` where
`Crumb = { label: string; href?: string }`. The create-page breadcrumb is a three-item array using
this exact shape (do **not** invent a new prop shape). The far-right info/share icons on the create
page are rendered by the create page itself in its header row, not added to `Breadcrumb`.

**`Pagination.tsx` (unchanged, reused everywhere).** This is the single pager used by both the real
hosted-zones list and the mocked `ConsoleListPage` pages. On a real list it paginates; on an empty
mocked page (`total={0}`) it renders nothing (returns `null` for `totalPages <= 1`). No static
`‹ 1 ›` pager is introduced anywhere (Decision 3).

**New shared icon/snippet set.** To avoid repeating inline SVG, add small presentational components
in a single file `components/icons.tsx`: `RefreshIcon`, `GearIcon`, `SortIcon` (sort indicator),
`GridIcon` (app-launcher), `BellIcon`, `HamburgerIcon`, `CloudShellIcon`, plus `InfoLink` (renders
`<a href="#" className="info-link">Info</a>`) and `NewTag`. These are pure, prop-less (except
`InfoLink` optionally taking an `href`) SVG/markup wrappers so pages and `ConsoleListPage` share one
definition. The hosted-zones page may swap its hand-rolled search SVG and text sort indicators for
`SortIcon` where appropriate (keeping its existing sort behavior for name/type only).

**`CreateZoneModal.tsx` (removed).** The create flow moves to the full page. Delete
`CreateZoneModal.tsx` and remove its import/usage from `hosted-zones/page.tsx` (it is only used
there; confirmed by read). `EditZoneModal`, `ConfirmDeleteModal`, `RecordModal`, `Modal`,
`FlashbarProvider`, `AuthProvider` are untouched.

### Create hosted zone full page — design
File: `hosted-zones/create/page.tsx` (`"use client"`). State: `name`, `type`
(`"Public" | "Private"`, default `"Public"`), `comment`, `submitting`, `error`. Uses `useRouter`
for navigation and `useFlash()` for the success toast — the same hooks the modal used, so behavior
is preserved.

Layout:
- `Breadcrumb` with
  `[{label:"Route 53", href:"/hosted-zones"}, {label:"Hosted zones", href:"/hosted-zones"},
  {label:"Create hosted zone"}]`, plus a header row with an `<h1>Create hosted zone</h1>` and
  far-right Info (ⓘ) + share icon-buttons (inline SVG, visual-only).
- `container-box` titled **Hosted zone configuration** with the pinned subtext, containing three
  `form-field`s, using the exact copy from **Pinned UI strings**:
  - **Domain name**: label + `InfoLink`; helper; `input placeholder="example.com"`; the
    valid-characters hint line below it.
  - **Description - optional**: label + `InfoLink`; helper; `textarea placeholder="The hosted zone is
    used for..."` with `maxLength={256}`; live counter `The description can have up to 256
    characters. {comment.length}/256`.
  - **Type**: label + `InfoLink`; helper; two selectable radio cards (`.radio-card`,
    `.radio-card--selected` when active) side by side — Public (default selected) and Private, with
    the pinned titles/descriptions and a radio input each.
- Separate `container-box` **Tags** with Info, the `Apply tags to hosted zones to help organize and
  identify them.` text, `No tags associated with the resource.`, an `Add new tag` button
  (visual-only no-op), and `You can add up to 50 more tags.`
- Footer row bottom-right: `Cancel` (blue `btn--link`, `router.push("/hosted-zones")`) and
  outlined-orange `Create hosted zone` (`btn btn--create`).

Submit handler (mirrors the old modal): trim `name`; if empty, set inline `error` and abort (no API
call). Otherwise `setSubmitting(true)`, call `api.createZone({ name: name.trim(), type, comment })`,
on success `flash.success(\`Hosted zone ${zone.name} created successfully.\`)` then
`router.push("/hosted-zones")`; on failure show the error message inline and keep the user on the
page; always clear `submitting`.

### globals.css additions (by name)
Additive only; **no existing rule rewritten and no new color token added**.
- Button variants:
  - `.btn--create` — outlined-orange, reusing the existing token:
    `background:#fff; border:1px solid var(--awsui-orange); color: var(--color-text-label);
    font-weight:700;` (hover darkens border/bg slightly via existing `--awsui-orange-hover`;
    disabled greys border/text). **No `#ff9900` literal, no `--awsui-orange-create` token.**
  - `.btn--outline-blue` — `background:#fff; border:1px solid var(--awsui-blue); color: var(--awsui-blue);`
    for the Dashboard card links (reuses the existing `--awsui-blue`).
- Top nav: `.topnav__icon-btn`, `.topnav__kbd` (the `[Alt+S]` badge), `.topnav__menu`
  (account dropdown), `.topnav__menu-item`.
- Sidebar: `.sidebar__group-header` (clickable row with chevron), `.sidebar__chevron`,
  `.sidebar__tag-new` (blue `New` pill), `.sidebar__external` (trailing ↗).
- Console chrome / icons: `.icon-btn` (circular refresh/gear buttons), `.sort-indicator`
  (next to sortable headers), `.helper-line` (automatic-mode text), `.helper-line a` for the blue
  settings link, `.banner` / `.banner--error` (red access-denied banner).
- Create page: `.radio-card`, `.radio-card--selected`, `.radio-card__title`,
  `.radio-card__desc`, `.char-counter`, `.valid-chars`, `.form-actions` (bottom-right footer row).
- Dashboard: `.dash-grid` (2x2 responsive grid), `.dash-card`, `.dash-card__title`,
  `.dash-card__body`, `.resource-list`.
- Keep the existing `.info-link` class (already defined) for `InfoLink`.
- The existing `.coming-soon` rules may be left in place (harmless) or removed; removing them is
  preferred once no markup uses them, but is not required for acceptance.

### How Create hosted zone replaces the modal path
1. `hosted-zones/page.tsx`: delete the `showCreate` state, the `CreateZoneModal` import, and the
   `{showCreate && <CreateZoneModal .../>}` block.
2. Both `Create hosted zone` triggers (the header primary button and the empty-state button) become
   `Link`s / `router.push` to `/hosted-zones/create` using the new `btn--create` class.
3. The new page performs the create and, on success, navigates back to `/hosted-zones`; because the
   list page refetches on mount (`useEffect(load)` on first render), the new zone appears without any
   cross-page callback. (The old `onCreated` refresh path is no longer needed.)
4. `api.createZone` is called with the identical payload shape `{ name, type, comment }`, so the
   backend contract is unchanged.

### How ComingSoon is removed without regressing login/auth
- Delete `components/ComingSoon.tsx` and the `app/coming-soon/` and `app/resolver/` folders.
- Rewrite each of the six former `ComingSoon` importers (`dashboard`, `health-checks`,
  `traffic-policies`, `profiles`, plus the deleted `resolver`/`coming-soon` which simply go away) to
  real content: Dashboard and Health checks are full custom pages; Profiles and Traffic policies are
  `ConsoleListPage` configs; the granular resolver/domains/IP/traffic sidebar pages are new
  `ConsoleListPage` configs.
- Rewrite `Sidebar.tsx` so no item points at `/coming-soon` or `/resolver`.
- `Shell.tsx` and `AuthProvider.tsx` are untouched: `Shell` still renders children bare while
  `loading` or `!user`, and the login page still provides its own layout. The route guard still
  redirects unauthenticated users to `/login` and authenticated users away from `/login`. Because no
  new page bypasses `Shell`, every new page sits inside the authenticated layout automatically.
- Verification: a repo-wide search over `frontend/src` for `coming-soon`, `ComingSoon`, and
  `Coming soon` returns zero matches, and no page imports `ComingSoon`.

### Error handling (concrete, per operation)
- **Create hosted zone — empty/whitespace name**: recoverable; no API call; inline
  `error = "Domain name is required."` shown under the field; user stays on page. Not logged.
- **Create hosted zone — API failure** (`api.createZone` throws, e.g. 400 duplicate name, 401, 5xx):
  recoverable; the thrown `Error.message` (already normalized by `api.request`) is shown inline;
  `submitting` reset so the user can retry; stays on page. Not separately logged (the client surfaces
  the message; the browser console carries the thrown error).
- **Hosted zones list load failure** (existing behavior, preserved): recoverable; `flash.error(message)`
  toast; the page shows its empty/loaded state. Unchanged from current code.
- **Session expiry (401) on any authed request**: the `AuthProvider` route guard already redirects to
  `/login` on `me()` failure at mount; mid-session 401s surface as the per-operation error above. No
  new handling added (out of scope).
- **Mocked pages**: perform no network calls, so have no failure modes; their tables render the empty
  state unconditionally. The Registered domains banner also renders unconditionally (static).

### External input validation
- **Domain name** (create page): required, non-empty after trim; type string; no explicit length cap
  beyond the browser input default (backend enforces any real limit — not duplicated client-side to
  avoid drift); on failure, inline error, no submit. The valid-characters hint is informational only
  and is **not** enforced client-side (matches the real console, which validates server-side).
- **Description** (create page): optional; string; hard cap 256 via `maxLength` on the textarea; live
  counter reflects current length; no failure path (truncation handled by the input).
- **Type**: constrained to `"Public" | "Private"` by the two radio cards; cannot be absent (Public
  default). No validation branch needed.
- **Search/filter inputs** on mocked pages: cosmetic, not wired to any query; accept any string, no
  validation.

### Invariants and ownership
- **"No Coming soon text anywhere / no ComingSoon import"** — owned by the frontend source/review:
  enforced by deleting the component and both routes and rewriting all six importers, verified by the
  acceptance-criteria grep. Source-level invariant checked at review time (no runtime guard).
- **No new color token** — owned by `globals.css`: `.btn--create`/`.btn--outline-blue` reference only
  the pre-existing `--awsui-orange`/`--awsui-blue`, so there is a single source of truth for each hue.
- **Sidebar label/route correctness** — owned by `Sidebar.tsx`'s single declared model; because
  every label and href lives in one data structure, order/grouping is enforced in one place.
- **Create payload shape** — owned by `api.ts` (`createZone` signature); the create page must call it
  with `{name,type,comment}` and nothing else, so the backend contract stays authoritative.
- **Auth gating** — owned by `AuthProvider` + `Shell`, unchanged; new pages inherit gating by living
  under the shared layout rather than enforcing it themselves.

### Testability
- **Unit-testable**: `Sidebar` rendering (correct labels/order/groups, New tags, external item,
  active class for a given `pathname` using the exact `isActive` guard), `ConsoleListPage` (renders
  title+count, Info, actions, empty state, banner from props, and the real `Pagination`), and the
  create page's submit handler (empty-name guard vs. API call) with `api.createZone` mocked. These are
  pure/prop-driven and mock the `api`/`useFlash`/`useRouter` hooks.
- **Integration-testable**: the create flow end-to-end (fill form → submit → zone appears in
  `/hosted-zones`), zone edit/delete and record CRUD still functioning, and auth login/logout — best
  exercised with the backend running (Playwright or manual). The static mocked pages need only a smoke
  render.
- No test framework is currently configured in `frontend`, and **no ESLint is configured**; adding
  either is out of scope. Primary verification for this task is a successful `npm run build`
  (tsc + next build) plus a manual/browser pass against the acceptance criteria. If a test runner is
  desired later, the prop-driven primitives above are the natural unit-test seams.

### Edge cases
- Collapsing a group whose child is the active route: the active child is hidden but the route stays
  mounted; re-expanding restores the highlight. Acceptable (matches console behavior).
- Direct navigation to a mocked route (e.g. `/vpcs`) while authenticated renders the console-styled
  empty page; while unauthenticated, `AuthProvider` redirects to `/login` first — unchanged.
- Creating a zone whose name already exists: surfaced as the inline API-error path; no client-side
  duplicate check.
- Very long description: capped at 256 by `maxLength`; counter shows `256/256`.
- `user` null in `TopNav` (shouldn't happen inside `Shell`, which renders children bare when
  `!user`): the account item guards with `user?.` and renders empty text, never throwing.
- Empty mocked page pager: the real `Pagination` returns `null` for `total=0`; the toolbar still shows
  the gear, and no pager control appears. This is intentional (Decision 3), not a missing element.
- Root `/` and `/login` keep their current behavior; no sidebar/topnav shown on `/login`.

---

## Responses to design-review findings

**Finding 1 [MEDIUM] — Registered domains banner has no trigger rule — ADDRESSED.** The banner now
renders **unconditionally** as static mocked content (FR-7a): a red `.banner` with the pinned text
`You don't have permission to view registered domains. Contact your administrator.` No state, no
dismiss, no trigger rule.

**Finding 2 [MEDIUM] — new `--awsui-orange-create: #ff9900` conflicts with the existing orange —
ADDRESSED.** The new token is removed. `.btn--create` reuses the existing `--awsui-orange` token
(`border:1px solid var(--awsui-orange)`), so the console keeps a single orange. The dashboard card
links use a new `.btn--outline-blue` variant built on the existing `--awsui-blue` (Decision 4).

**Finding 3 [MEDIUM] — per-page columns undefined — ADDRESSED.** The **Per-page table spec** section
pins, for every mocked page, the exact title, count (0), filter placeholder, and ordered column
labels, plus the empty-state copy and any header/banner actions.

**Finding 4 [NIT] — `isActive` described imprecisely — ADDRESSED.** The design now specifies the
helper exactly as it exists: `pathname === href || (href !== "/" && pathname.startsWith(href + "/"))`,
preserving the root guard. `Hosted zones` intentionally stays highlighted on `/hosted-zones/create`.

**Finding 5 [NIT] — Tags "Add new tag" left as a dangling choice — ADDRESSED.** Pinned: `Add new tag`
is visual-only (no-op `onClick`); the count text stays `You can add up to 50 more tags.` statically.
No tag list state is added.

**Finding 6 [NIT] — description placeholder change not called out — ADDRESSED.** The design now notes
that the create-page textarea placeholder `The hosted zone is used for...` intentionally differs from
the old modal's `Any comments about this hosted zone`, matching the real console (not a regression).

**Additional (Decision 1) — ESLint / `next lint`:** every `next lint` mention is removed; verification
is `npm run build` (tsc + next build) + browser visual checks only, because no ESLint is configured in
the repo and none is added.

**Additional (Decision 2) — TopNav account label:** displays `user.username` and `user.account_id`
from the existing `User` type with a working Sign out; no hard-coded display name.

**Additional (Decision 3) — Pagination:** the real `Pagination` component is reused everywhere
(hosted zones and all mocked pages with `total=0`); no static `‹ 1 ›` pager exists.

**Additional (Decision 5) — ComingSoon removal is repo-wide:** all six importing pages are rewritten,
the component and the `/coming-soon` and `/resolver` routes are deleted, and the grep for
`Coming soon` / `ComingSoon` returns zero matches.
