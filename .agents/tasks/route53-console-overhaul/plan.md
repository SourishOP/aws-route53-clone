# Implementation Plan — Route 53 Console Visual-Fidelity Overhaul

Source of truth: `.agents/tasks/route53-console-overhaul/design.md` (APPROVED). All paths are absolute
Windows paths under `c:\Users\dasso\OneDrive\Desktop\Scalar\frontend`. Backend is NOT touched
(`created_by` is already exposed by `backend/app/schemas.py`; `lib/types.ts` already has it, confirmed).
No worktree — edits land directly in `c:\Users\dasso\OneDrive\Desktop\Scalar\frontend`.

Global verification for every task: `npm run build` run in `c:\Users\dasso\OneDrive\Desktop\Scalar\frontend`
(this is `next build` = tsc typecheck + Next build). There is NO eslint gate — do NOT run `npm run lint`
and do NOT add eslint. Final visual verification: run backend + `npm run dev`, log in with admin/admin in
a browser, and confirm each page against the design.

Decisions baked in (locked, do not re-litigate): no eslint gate; TopNav shows real `user.username` /
`user.account_id`; reuse the existing `components/Pagination.tsx` everywhere (`total={0}` on mocked
pages renders no visible pager, which is intentional); reuse existing `--awsui-orange` / `--awsui-blue`
tokens with NO new `#ff9900` token; `ComingSoon` removed repo-wide including `/coming-soon` and
`/resolver` routes.

---

- [ ] 1. Add additive classes to globals.css (no existing rule rewritten, no new color token).
      Add, after the existing button rules: `.btn--create` (outlined-orange: `background:#fff;
      border:1px solid var(--awsui-orange); color:var(--color-text-label); font-weight:700;` + hover
      using `--awsui-orange-hover` + disabled greys) and `.btn--outline-blue` (`background:#fff;
      border:1px solid var(--awsui-blue); color:var(--awsui-blue);`). Add top-nav classes
      `.topnav__icon-btn`, `.topnav__kbd` ([Alt+S] badge), `.topnav__menu`, `.topnav__menu-item`.
      Add sidebar classes `.sidebar__group-header`, `.sidebar__chevron`, `.sidebar__tag-new` (blue New
      pill), `.sidebar__external` (trailing ↗). Add console chrome `.icon-btn` (circular refresh/gear),
      `.sort-indicator`, `.helper-line` + `.helper-line a`, `.banner` / `.banner--error` (red). Add
      create-page `.radio-card`, `.radio-card--selected`, `.radio-card__title`, `.radio-card__desc`,
      `.char-counter`, `.valid-chars`, `.form-actions`. Add dashboard `.dash-grid`, `.dash-card`,
      `.dash-card__title`, `.dash-card__body`, `.resource-list`. Reuse existing `.info-link`,
      `.empty-state`, `.container-box`, `.toolbar`, `.data-table`, `.page-header`. Do NOT add `#ff9900`
      or `--awsui-orange-create`.
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\app\globals.css
      Verify: `npm run build` succeeds (no new classes break parse); grep confirms no `#ff9900` /
      `--awsui-orange-create` added. Visual check deferred to later tasks.

- [ ] 2. Create the shared icon/snippet component file.
      Add pure presentational components: `RefreshIcon`, `GearIcon`, `SortIcon`, `GridIcon`,
      `BellIcon`, `HamburgerIcon`, `CloudShellIcon`, `InfoLink` (renders `<a href="#" className=
      "info-link">Info</a>`, optional `href`), `NewTag` (blue New pill span). All inline SVG/markup,
      matching the current TopNav inline-SVG pattern.
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\components\icons.tsx
      Verify: `npm run build` succeeds.

- [ ] 3. Rewrite Sidebar as a data-driven component with the exact groups/order.
      Declare `TOP_LINKS` (Dashboard `/dashboard`, Hosted zones `/hosted-zones`, Health checks
      `/health-checks`, Profiles `/profiles`), `GROUPS` in order — Global Resolver (Global resolvers
      `/global-resolvers` New tag, Shared DNS views `/shared-dns-views` New tag), VPC Resolver (VPCs
      `/vpcs`, Inbound endpoints `/inbound-endpoints`, Outbound endpoints `/outbound-endpoints`, Rules
      `/rules`, Query logging `/query-logging`, Outposts `/outposts`), Domains (Registered domains
      `/registered-domains`, Requests `/requests`), IP-based routing (CIDR collections
      `/cidr-collections`), Traffic flow (Traffic policies `/traffic-policies`, Policy records
      `/policy-records`) — and `DNS_FIREWALL` ({ label:"DNS Firewall", href:"#", external:true }).
      Collapsible groups use `useState<Record<string,boolean>>` keyed by group label (default all
      open); header is a `<button className="sidebar__group-header">` with ▼/▶ chevron. New tag via
      `.sidebar__tag-new`; external via plain `<a>` with trailing ↗ and `rel="noreferrer"`. Keep the
      `isActive` helper BYTE-FOR-BYTE: `pathname === href || (href !== "/" && pathname.startsWith(href
      + "/"))`. No reference to `/coming-soon` or `/resolver`.
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\components\Sidebar.tsx
      Verify: `npm run build` succeeds. (Visual: sidebar groups/order/New tags/collapse checked in
      final browser pass.)

- [ ] 4. Rewrite TopNav with the full console top bar.
      Keep `useAuth()` for `user`/`logout`. Left→right: hamburger button (`.topnav__icon-btn`, inline
      SVG, no-op), existing AWS logo SVG (keep as-is), app-launcher 3x3 grid button (`GridIcon`, no-op),
      centered search block (`<div className="topnav__search">` with `<input placeholder="Search">` and
      a right `<span className="topnav__kbd">[Alt+S]</span>`), `.topnav__spacer`, then CloudShell
      button (`>_` glyph, no-op), bell button (`BellIcon`, no-op), and an account item showing
      `{user?.username} @ {user?.account_id} ▾` (guard with `user?.` — NO hard-coded "First Principles"
      / "Sourish Das"). Account item toggles a `.topnav__menu` dropdown (client state) with a Sign out
      `.topnav__menu-item` calling `logout()`. Keep the `N. Virginia ▾` region item if desired but it
      is optional; the Sign out MUST remain reachable.
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\components\TopNav.tsx
      Verify: `npm run build` succeeds. (Visual: account menu + Sign out works in final pass.)

- [ ] 5. Create the reusable ConsoleListPage wrapper.
      Implement the props contract from the design: `breadcrumb: Crumb[]` (reuse `Breadcrumb`'s
      `Crumb`), `title`, `count?`, `info?`, `description?`, `actions?: ConsoleAction[]`, `showRefresh?`,
      `filterPlaceholder?`, `columns?: {label}[]`, `emptyTitle?`, `emptyText?`, `emptyAction?`,
      `banner?: ReactNode`, `showPager?` (default true when columns present), `showGear?` (default true
      when columns present), `children?`. `ConsoleAction = { label; variant?: "secondary" |
      "outlined-orange"; onClick?; disabled?; dropdown? }`. Render: `Breadcrumb`, optional banner,
      page-header row (title + optional `(N)` + `InfoLink`; right: `showRefresh` icon-btn then actions),
      optional description, then a `.container-box`: when `columns` given render toolbar (filter input +
      right-aligned real `Pagination` with `page={1} pageSize={10} total={0}` + gear) + `.data-table`
      head + empty state (`emptyTitle`/`emptyText`/`emptyAction`); when `columns` omitted render
      `children`. `variant:"outlined-orange"` uses `btn btn--create`; `"secondary"` uses `btn`.
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\components\ConsoleListPage.tsx
      Verify: `npm run build` succeeds.

- [ ] 6. Rework the hosted-zones list page to match the console (keep all CRUD behavior).
      In `hosted-zones/page.tsx`: title becomes `Hosted zones ({total})` with live count in the H1 area;
      remove `showCreate` state + `CreateZoneModal` import + the `{showCreate && <CreateZoneModal/>}`
      block. Header-right order: circular refresh icon-btn (reloads via `load()`), secondary
      `View details` / `Edit` / `Delete` (disabled until a row selected), then primary outlined-orange
      `Create hosted zone` as a `Link` to `/hosted-zones/create` (class `btn btn--create`); empty-state
      `Create hosted zone` button also links to `/hosted-zones/create`. Add helper line
      `Automatic mode is the current search behavior optimized for best filter results.` + blue link
      `To change modes go to settings.` (`.helper-line`). Filter input placeholder becomes
      `Filter records by property or value`. Add a settings gear icon-btn in the toolbar beside the
      existing real `Pagination`. Columns in order: Hosted zone name (sortable), Type (sortable),
      Created by (PLAIN non-sortable header, render `z.created_by`), Record count, Description, Hosted
      zone ID. Empty state: heading `No hosted zones`, subtext `There are no hosted zones created for
      this account.` Keep EditZoneModal / ConfirmDeleteModal / search debounce / sort / Pagination wiring
      intact.
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\app\hosted-zones\page.tsx
      Verify: `npm run build` succeeds. (Visual: Create navigates to full page; edit/delete still work.)

- [ ] 7. Build the full Create hosted zone page and delete CreateZoneModal.
      Create `hosted-zones/create/page.tsx` (`"use client"`): state `name`, `type` ("Public"|"Private",
      default "Public"), `comment`, `submitting`, `error`; use `useRouter` + `useFlash`. `Breadcrumb`
      items `[{label:"Route 53",href:"/hosted-zones"},{label:"Hosted zones",href:"/hosted-zones"},
      {label:"Create hosted zone"}]` + header row `<h1>Create hosted zone</h1>` with far-right Info +
      share icon-buttons (visual-only). `.container-box` titled `Hosted zone configuration` with pinned
      subtext and three fields using EXACT pinned strings from design (Domain name helper +
      `placeholder="example.com"` + valid-chars hint line; Description - optional helper + `textarea
      placeholder="The hosted zone is used for..."` with `maxLength={256}` + live counter
      `The description can have up to 256 characters. {comment.length}/256`; Type helper + two
      `.radio-card` cards Public (default `.radio-card--selected`) / Private with pinned titles/descs).
      Separate `.container-box` `Tags` with pinned subtext, `No tags associated with the resource.`,
      visual-only `Add new tag` button (no-op), and static `You can add up to 50 more tags.` Footer
      `.form-actions`: `Cancel` (`btn--link`, `router.push("/hosted-zones")`) + outlined-orange
      `Create hosted zone` (`btn btn--create`). Submit: trim name; empty → inline
      `error="Domain name is required."` and abort; else `api.createZone({name:name.trim(),type,comment})`,
      on success `flash.success(\`Hosted zone ${zone.name} created successfully.\`)` +
      `router.push("/hosted-zones")`; on failure inline error, stay; always clear `submitting`. Then
      DELETE `components/CreateZoneModal.tsx`.
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\app\hosted-zones\create\page.tsx,
      c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\components\CreateZoneModal.tsx (deleted)
      Verify: `npm run build` succeeds (no dangling CreateZoneModal import — task 6 already removed it).
      (Visual: fill form → submit → flashbar → zone appears in list.)

- [ ] 8. Build the full Dashboard page (replace ComingSoon).
      Rewrite `dashboard/page.tsx`: `Breadcrumb` `[{label:"Route 53",href:"/hosted-zones"},
      {label:"Dashboard"}]`; title `Route 53 Dashboard` + blue Info; a `.dash-grid` 2x2 of `.dash-card`s
      (DNS management + `Create hosted zone` `.btn--outline-blue` link to `/hosted-zones/create`;
      Availability monitoring + `Create health check`; Traffic management + `Create policy`; Domain
      registration with red `Error`); a `Register domain` card; a `Notifications` card (refresh, search,
      pager, Resource/Status columns, empty `No notifications to display`); a `More resources ↗` card; a
      `Service health` card. All static, links `href="#"` except the hosted-zone create link. No
      placeholder/Coming soon text.
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\app\dashboard\page.tsx
      Verify: `npm run build` succeeds.

- [ ] 9. Build the full Health checks page (replace ComingSoon).
      Rewrite `health-checks/page.tsx`: `Breadcrumb` `[{label:"Route 53",href:"/hosted-zones"},
      {label:"Health checks"}]`; title `Health checks (0)` + blue Info; right circular refresh +
      outlined-orange `Create health check`; subtext about monitoring; `Find health check` filter; real
      `Pagination` (total 0) + gear; columns (checkbox) ID, Name, State, Details, Status in last 24
      hours, Actions; empty state centered `No health checks to display.` + `Create health check`
      button. Static/mocked. May reuse `ConsoleListPage` or be a custom page.
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\app\health-checks\page.tsx
      Verify: `npm run build` succeeds.

- [ ] 10. Build all mocked sidebar pages via ConsoleListPage and rewrite Profiles/Traffic policies.
      Rewrite `profiles/page.tsx` and `traffic-policies/page.tsx` (remove ComingSoon) and create new
      pages, each a thin `ConsoleListPage` config per the Per-page table spec (title+(0), filter
      placeholder, ordered columns, empty-state heading `No {lower title}` / subtext `There are no
      {lower title} to display.`, breadcrumb `Route 53 > {Title}`):
      Profiles `/profiles`; Global resolvers `/global-resolvers`; Shared DNS views `/shared-dns-views`;
      VPCs `/vpcs`; Inbound endpoints `/inbound-endpoints`; Outbound endpoints `/outbound-endpoints`;
      Rules `/rules`; Query logging `/query-logging`; Outposts `/outposts`; Registered domains
      `/registered-domains` (unconditional red `.banner banner--error` with EXACT text `You don't have
      permission to view registered domains. Contact your administrator.` + visual-only `Register
      domain`/`Transfer`/`Transfer out` secondary actions); Requests `/requests`; CIDR collections
      `/cidr-collections`; Traffic policies `/traffic-policies` (visual-only outlined-orange `Create
      traffic policy`); Policy records `/policy-records` (visual-only outlined-orange `Create policy
      record`). Columns per the Per-page table spec table in design.md.
      Files (create unless noted): c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\app\profiles\page.tsx (rewrite),
      ...\traffic-policies\page.tsx (rewrite), ...\global-resolvers\page.tsx, ...\shared-dns-views\page.tsx,
      ...\vpcs\page.tsx, ...\inbound-endpoints\page.tsx, ...\outbound-endpoints\page.tsx, ...\rules\page.tsx,
      ...\query-logging\page.tsx, ...\outposts\page.tsx, ...\registered-domains\page.tsx, ...\requests\page.tsx,
      ...\cidr-collections\page.tsx, ...\policy-records\page.tsx
      Verify: `npm run build` succeeds.

- [ ] 11. Remove ComingSoon repo-wide and confirm no residue.
      Delete `components/ComingSoon.tsx`, the folder `app/coming-soon/`, and the folder `app/resolver/`.
      Optionally remove the now-unused `.coming-soon` CSS rules in globals.css (harmless to leave).
      Files: c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\components\ComingSoon.tsx (deleted),
      c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\app\coming-soon\ (deleted),
      c:\Users\dasso\OneDrive\Desktop\Scalar\frontend\src\app\resolver\ (deleted)
      Verify: `npm run build` succeeds AND a repo-wide grep over `frontend/src` for `Coming soon`,
      `coming-soon`, and `ComingSoon` returns zero matches, and no page imports `ComingSoon`.

- [ ] 12. Final integration + visual verification.
      Confirm auth/Shell untouched (Shell still renders children bare while loading/!user; login works;
      unauthenticated users still redirect to /login). Run `npm run build` once more. Start backend and
      `npm run dev`, log in as admin/admin, and visually verify: sidebar groups/order/New tags/collapse
      + DNS Firewall external; top nav hamburger/logo/grid/centered search [Alt+S]/CloudShell/bell/
      account menu with real username+account_id + working Sign out; hosted-zones list (count in title,
      refresh, selection-gated View details/Edit/Delete, outlined-orange Create navigating to the full
      page, helper line, filter placeholder, six columns incl. non-sortable Created by, empty-state
      copy); create page (all pinned strings, radio cards, Tags, counter, Cancel + Create → flashbar →
      list); Dashboard and Health checks full layouts; every mocked page styled (Registered domains
      banner); and zone edit/delete + DNS record CRUD still work.
      Files: (verification only)
      Verify: `npm run build` succeeds; browser pass against all acceptance criteria passes.

## Notes / assumptions
- `.info-link`, `.empty-state`, `.container-box`, `.toolbar`, `.data-table`, `.page-header`,
  `.badge`, `.sidebar__link.active`, `.topnav__search`, `.topnav__spacer` already exist in globals.css
  and are reused as-is (confirmed by read).
- `components/Pagination.tsx` returns `null` when `totalPages <= 1`, so mocked pages (`total=0`) show
  the gear but no visible pager — intentional per Decision 3.
- Backend/`lib/types.ts`/`lib/api.ts` are NOT modified; `HostedZone.created_by` and
  `api.createZone({name,type,comment})` already exist.
- `package.json` has a `lint` script but no eslint config installed; do NOT invoke it (Decision 1).
