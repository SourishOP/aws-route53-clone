# Design Review (Iteration 2) — Route 53 Console Overhaul

Reviewer: design-review subagent (fresh read, no authoring context)
Scope reviewed: the UPDATED `design.md` for the Route 53 console UI overhaul, checked against the
actual frontend source under `frontend/src` and the backend schema under `backend/app`. This is a
re-review of the revision that was supposed to close the 3 MEDIUM + 3 NIT findings from the prior
review via five locked user decisions.

## Method

I read the updated design in full (both halves, through the "Responses to design-review findings"
section), then verified every concrete claim it makes about the existing codebase and every one of
the five locked decisions by reading the real files:

- `components/Pagination.tsx` — prop shape and single-page `null` behavior.
- `components/Breadcrumb.tsx` — `Crumb` / `{ items }` API.
- `lib/types.ts` — `User` (`username`, `account_id`), `HostedZone.created_by`.
- `lib/api.ts` — `createZone({ name, type, comment })`.
- `backend/app/schemas.py` — `HostedZoneOut.created_by: str = "Route 53 console"`.
- `app/globals.css` — existing `--awsui-orange`/`--awsui-blue`/`--color-text-label` tokens; grep for
  `#ff9900` / `--awsui-orange-create`.
- `components/Sidebar.tsx` — the exact `isActive` helper.
- Repo-wide grep for `ComingSoon` importers.

No builds or servers were run (document-only review, as instructed).

Per the step instructions, the five locked decisions (no ESLint gate; real `user.username`/
`user.account_id` in TopNav; reuse the real `Pagination` with `total=0`; reuse `--awsui-orange`, no
`#ff9900`; ComingSoon removed repo-wide incl. `/coming-soon` and `/resolver`) are RESOLVED by fiat and
are NOT reopened. I verified only that the updated design actually bakes them in, and that the three
MEDIUM items plus the three NITs are genuinely addressed in the document.

---

## Findings

No HIGH or MEDIUM findings. No NIT findings. Every blocking item from the prior review is resolved in
the updated design, and each resolution is consistent with the real source.

The verification details that would otherwise have been findings are recorded below as confirmed
resolutions:

- **Prior Finding 1 (banner trigger) — resolved.** FR-7a and the "Responses" section now specify the
  Registered domains banner renders **unconditionally** as static mocked content, with the pinned
  text `You don't have permission to view registered domains. Contact your administrator.` No state,
  no dismiss, no trigger ambiguity. The Per-page table spec reiterates it. Deterministic.
- **Prior Finding 2 (`#ff9900` token conflict) — resolved.** Decision 4, NFR-1, the "globals.css
  additions" section, and the "Responses" section all state `.btn--create` reuses the existing
  `--awsui-orange` with `background:#fff; border:1px solid var(--awsui-orange); color:
  var(--color-text-label); font-weight:700;`. No `#ff9900` literal and no `--awsui-orange-create`
  token remain in the design. A grep over `frontend/src` confirms neither string exists in source
  either. The dashboard links use a new `.btn--outline-blue` built on the existing `--awsui-blue`.
- **Prior Finding 3 (per-page columns undefined) — resolved.** The new **Per-page table spec** table
  pins, for all 14 mocked pages (Profiles, Global resolvers, Shared DNS views, VPCs, Inbound
  endpoints, Outbound endpoints, Rules, Query logging, Outposts, Registered domains, Requests, CIDR
  collections, Traffic policies, Policy records), the exact title + `(0)` count, filter placeholder,
  and ordered column labels, plus a generic empty-state copy rule. Health checks and Hosted zones
  columns are pinned in their own FR/strings sections. Every mocked sidebar destination is covered.
- **Prior NIT 4 (`isActive` imprecise) — resolved.** The design now quotes the helper verbatim as
  `pathname === href || (href !== "/" && pathname.startsWith(href + "/"))`, which matches
  `Sidebar.tsx` lines 28-29 exactly (root guard preserved).
- **Prior NIT 5 (Tags dangling choice) — resolved.** Pinned: `Add new tag` is visual-only (no-op
  `onClick`), count text stays `You can add up to 50 more tags.` statically, no tag state.
- **Prior NIT 6 (description placeholder) — resolved.** The design explicitly notes the create-page
  placeholder `The hosted zone is used for...` intentionally differs from the old modal copy
  (`Any comments about this hosted zone`) to match the real console; not a regression.

---

## Verified Assumptions

Checked against source and correct:

1. `Pagination` props are `{ page, pageSize, total, onPageChange }` and it `return null` when
   `totalPages <= 1` (`Math.max(1, Math.ceil(total/pageSize))`). Confirmed in `Pagination.tsx`. So
   reusing it with `page={1} pageSize={N} total={0}` renders no visible pager — exactly as Decision 3
   describes. No static `‹ 1 ›` pager is introduced in the design.
2. `Breadcrumb` is `({ items }: { items: Crumb[] })` with `Crumb = { label: string; href?: string }`.
   Confirmed in `Breadcrumb.tsx`. The three-item create-page breadcrumb reuses this unchanged — no new
   prop shape invented.
3. `HostedZoneOut.created_by: str = "Route 53 console"` exists on the backend; `HostedZone.created_by`
   exists in `types.ts`. Confirmed. The `Created by` column renders real data with no backend change,
   and marking it a non-sortable constant header is consistent with it being a fixed default value.
4. `User` exposes `username` and `account_id`. Confirmed in `types.ts`. TopNav can display the real
   fields (Decision 2) with no placeholder display name.
5. `api.createZone` accepts exactly `{ name: string; type: string; comment: string }` and returns a
   `HostedZone`. Confirmed in `api.ts`. The create-page submit payload matches.
6. Existing tokens `--awsui-orange: #ec7211`, `--awsui-blue: #0972d3`, `--awsui-orange-hover`,
   `--color-text-label: #000716` all exist in `globals.css`. Confirmed. `.btn--create` and
   `.btn--outline-blue` reference only pre-existing tokens.
7. No `#ff9900` and no `--awsui-orange-create` appear anywhere under `frontend/src`. Confirmed by grep
   (zero matches).
8. The exact six `ComingSoon` importers named in Decision 5 / FR-9 exist and match: `dashboard`,
   `health-checks`, `traffic-policies`, `profiles`, `resolver`, `coming-soon`, plus the
   `ComingSoon.tsx` component. Confirmed by grep. Deleting the component + `/coming-soon` + `/resolver`
   routes and rewriting the four remaining importers clears every `Coming soon` / `ComingSoon`
   reference.
9. The `isActive` helper in `Sidebar.tsx` is byte-for-byte the string the design pins. Confirmed.

## Unverified / Wrong Assumptions

None. Every factual claim the updated design makes about existing APIs, types, hooks, tokens, and
components matched the source. No wrong or contradicted-by-source assumption was found. (Builds/tests
were intentionally not run per the document-only review constraint; the acceptance criteria that
depend on `next build` succeeding are therefore asserted, not executed — this is by instruction, not a
gap in the design.)

---

## Verdict

Count of blocking findings: **0 HIGH, 0 MEDIUM** (and 0 NIT).

Because HIGH + MEDIUM = 0, the verdict is **APPROVED**. All three prior MEDIUM findings and all three
prior NITs are resolved in the document, each resolution is pinned unambiguously, and every one is
consistent with the real source files. The five locked decisions are correctly baked in. The design is
ready for implementation.
