# Månedstavla Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A monthly leaderboard: a winner's podium on the pixel-office wall, a panel to browse every month back to the first, «mest framgang», a month list on phones, and archiving instead of deleting so finished months never change.

**Architecture:** Pure month maths in `lib/month-board.ts` (built on the existing `rankBetween` in `lib/trophy.ts`), the podium drawing in `lib/podium.ts`, both unit-tested. The 5-second snapshot gains `monthSeconds` per active employee so the wall podium is live; the panel fetches one month at a time through a Server Action. `employees.archived_at` replaces hard deletes for anyone who has stood.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript strict, Drizzle + Neon (`neon-http`), Vitest 3, CSS Modules.

**Spec:** `docs/superpowers/specs/2026-11-16-manedstavla-design.md` (read it first). Approved sketch: https://claude.ai/artifact/3AkMZ36WRpRVLEXVZPwBU4

All paths below are relative to `standing-challenge/`. Work on branch `manedstavla`. Read `standing-challenge/CLAUDE.md` and `AGENTS.md` (this Next.js differs from training data) before starting.

## Global Constraints

- All month maths in Europe/Oslo via `lib/time.ts` (`osloMonthStart`, `osloPrevMonthStart`, `osloParts`, `osloWallToUtc`); never server-local time.
- Seconds per window come from `creditedSecondsBetween` (`lib/sessions.ts`); ranking of a month from `rankBetween` (`lib/trophy.ts`). Pallen, panel and vandrepokal must never disagree on a winner.
- «Mest framgang» is measured in **hours (seconds), not percent**: this month minus own previous month; largest positive increase wins; the month winner may win it; no line when nobody increased or in the first month; current month says «så langt»; ties go to whoever ranks higher in the month.
- Podium is the 68×54 grid from the spec table; heads are `spriteRects(figure, { pose: 'stand' })` cropped to `HEAD_VIEWBOX`, winner with `crown: true`. Shown at **1,5×** (102 × 81 px) on the wall, 3× in the panel.
- Wall label «Månedens ståere». All new copy in both `locales/nb.json` and `locales/en.json`. No pixel fonts for text.
- Wall prop sits right of the right window (~40 px gap), vertically centred on it; never overlaps `.screens`, the hanging plant or anything else at 701–1920 px with 0, 1, 2 wall screens.
- Archived people: hidden from room, wall screens, today/week/current-month lists, admin's active list, login and heiarop; still present (name + figure) in finished months.
- `archived_at` must be pushed with `npm run db:push:prod` **before** the code using it is deployed. Never push to `master` without Andreas' go-ahead (it deploys).

## Review Focus

1. **Month with 0, 1 or 2 people who stood** — podium draws empty blocks, no crash, no «undefined» in the status line. Test in Task 3 and Task 4.
2. **A round that crosses midnight between two months** (e.g. 31 Oct 23:30 → 1 Nov 00:30) — split 30/30 min between the months. Test in Task 3.
3. **Someone archived mid-month** — gone from the current month and the wall; still in last month's list with their figure. Test in Task 3.
4. **Archived person with a still-valid login cookie** — lands on `/login` with an explanation, never a redirect loop between `/` and `/login`. Manual check in Task 2.
5. **Browsing to a month before the first round / after the current month** — arrows disabled; the server action rejects such a month. Test in Task 3 (`clampMonth`) and Task 5.

---

### Task 1: `archived_at` and archive-instead-of-delete in admin

**Files:**
- Modify: `db/schema.ts` (employees table)
- Modify: `app/actions/admin.ts` (`deleteEmployee`, new `restoreEmployee`)
- Modify: `app/admin/page.tsx`, `components/admin/AdminPanel.tsx`, `components/admin/Admin.module.css`
- Modify: `locales/nb.json`, `locales/en.json`

**Interfaces:**
- Produces: column `archivedAt: timestamp('archived_at', { withTimezone: true })` (nullable) on `employees`; `EmployeeRecord.archivedAt: Date | null`.
- Produces: `restoreEmployee(input: { id: string }, lang?: string): Promise<void>` in `app/actions/admin.ts`.

- [ ] **Step 1:** Add `archivedAt` to `employees` in `db/schema.ts` with a doc comment: «Set when the person left. Their rounds stay so finished months never change. Null = active.»
- [ ] **Step 2:** `deleteEmployee`: keep the self-check; if the employee has at least one row in `stand_sessions`, `update employees set archived_at = now(), seat = null`; otherwise delete as today. Close any open round of theirs first (`ended_at = least(now, round_ends_at)`, `end_reason = 'admin'`), so an archived person is never left standing.
- [ ] **Step 3:** `restoreEmployee`: admin-only like the rest; `archived_at = null` (seat stays null).
- [ ] **Step 4:** `app/admin/page.tsx` selects active (`isNull(archivedAt)`) and archived rows separately; `AdminPanel` gets a new prop `archived: { id: string; name: string; figure: Figure }[]` and renders, under the seat grid, a section «Arkiverte» (hidden when empty) listing each with `PixelHead` + name + button «Hent tilbake».
- [ ] **Step 5:** i18n keys (nb / en): `admin.archived` «Arkiverte» / «Archived», `admin.restore` «Hent tilbake» / «Bring back», `admin.archivedHint` «Har stått før, så rundene deres blir med i gamle måneder.» / «They have stood before, so their rounds stay in past months.», `figure.removed` stays.
- [ ] **Step 6:** Run `npx tsc --noEmit && npm run lint && npm test`. Expected: all pass (199+ tests).
- [ ] **Step 7:** Commit `Admin: archive people who have stood instead of deleting them`.

### Task 2: Archived people are out of the live app

**Files:**
- Modify: `auth.ts` (signIn callback), `lib/current-employee.ts`, `app/login/page.tsx`, `app/login/LoginCard.tsx`, `app/api/office/route.ts`, `lib/office.ts`, `app/actions/cheer.ts`, `app/actions/stand.ts`, locales.

**Interfaces:**
- Produces: `getCurrentEmployee()` returns `null` for an archived employee. `loadOfficeSnapshot` only includes rows where `archived_at is null`.

- [ ] **Step 1:** `auth.ts` signIn callback: after the domain check, look the e-mail up; if the row exists with `archivedAt` set, return `false` (→ `/login?error=AccessDenied`).
- [ ] **Step 2:** `getCurrentEmployee`: return `null` when `ensureEmployee` gives back an archived row.
- [ ] **Step 3:** `app/login/page.tsx`: redirect to `/` only when `getCurrentEmployee()` is non-null (not `getSessionEmail()`); when a session e-mail exists but the employee is archived, pass `error="Archived"` to `LoginCard`, which shows `login.archived` «Du er ikke lenger med i Stå på!. Spør en admin hvis det er feil.» / «You are no longer part of Stå på!. Ask an admin if that is wrong.»
- [ ] **Step 4:** `/api/office`: 401 when `getCurrentEmployee()` is null (instead of `getSessionEmail()`), so an archived person's open tab goes to `/login`.
- [ ] **Step 5:** `lib/office.ts` `loadOfficeSnapshot`: `db.select().from(employees).where(isNull(employees.archivedAt))`. `buildSnapshot` already ignores sessions with no employee row.
- [ ] **Step 6:** `cheer.ts` and `stand.ts` (start-for target): add `isNull(employees.archivedAt)` to the target lookup so the existing «not found» error applies.
- [ ] **Step 7:** Verify: `npx tsc --noEmit && npm run lint && npm test` pass. Manual (`npm run dev -- -p 3107`, dev login): archive a throwaway employee created in admin, log in as them → login card with the archived message, no loop. Delete the throwaway afterwards. **This writes to production** (there is only one DB): use only a throwaway e-mail and clean up.
- [ ] **Step 8:** Commit `Archived people can't log in and leave the room`.

### Task 3: Month board maths (`lib/month-board.ts`)

**Files:**
- Create: `lib/month-board.ts`, `lib/month-board.test.ts`

**Interfaces:**
- Consumes: `rankBetween(sessions, now, from, to)` from `lib/trophy.ts`; `SessionRow` from `lib/snapshot.ts`; `Figure`.
- Produces:
```ts
export interface BoardPerson { id: string; name: string; figure: Figure; archived: boolean }
export interface MonthRow { id: string; name: string; figure: Figure; seconds: number; rank: number }
export interface Progress { id: string; name: string; gainSeconds: number }
export interface MonthBoard {
  monthStart: number        // osloMonthStart of the month shown
  done: boolean             // the month is over (monthStart < osloMonthStart(now))
  rows: MonthRow[]          // most seconds first; ties by name ('nb')
  totalSeconds: number
  progress: Progress | null
}
export function monthBoard(people: BoardPerson[], sessions: SessionRow[], now: number, monthStart: number, firstMonthStart: number): MonthBoard
export function nextMonthStart(monthStart: number): number   // via osloParts + osloWallToUtc
export function clampMonth(monthStart: number, firstMonthStart: number, now: number): number
```

- [ ] **Step 1: Write the failing tests** in `lib/month-board.test.ts` (build sessions with `osloWallToUtc`; `now` = 2026-11-16 12:00 Oslo):
  - `ranks a finished month by seconds, ties by name` — Even 3 h, Anja 1 h, Bo 1 h in October → rows Even, Anja, Bo; `done === true`; `totalSeconds === 5 * 3600`.
  - `splits a round across the month boundary` — 2026-10-31 23:30 → 2026-11-01 00:30 Oslo gives 1800 s to October and 1800 s to November.
  - `current month leaves archived people out, finished months keep them` — Kari archived, stood in October and on 2 November → present in October's rows, absent from November's.
  - `progress is the largest gain in hours over own previous month` — Oct: Even 10 h, George 1 h; Nov: Even 12 h, George 9 h → `{ name: 'George', gainSeconds: 8 * 3600 }`.
  - `the winner can win progress` — Oct: Even 1 h; Nov: Even 10 h, Anja 2 h → progress is Even.
  - `no progress when nobody gained, or in the first month` — both cases → `null`.
  - `progress ties go to the higher-ranked person` — equal gains → the one with more seconds this month.
  - `empty month` — no sessions → `rows: []`, `progress: null`, `totalSeconds: 0`.
  - `clampMonth keeps months inside first..current` — before first → first; after current → `osloMonthStart(now)`.
- [ ] **Step 2:** Run `npx vitest run lib/month-board.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement. Rows from `rankBetween(sessions, now, monthStart, nextMonthStart(monthStart))` joined to `people` by id; drop ids with no person; when `!done` also drop `archived` people; then sort seconds desc, name asc. Progress: compare with `rankBetween` over `[osloPrevMonthStart(monthStart), monthStart)`; none when `monthStart <= firstMonthStart`.
- [ ] **Step 4:** Run `npx vitest run lib/month-board.test.ts`. Expected: PASS.
- [ ] **Step 5:** Commit `Month board: ranking, progress and month bounds`.

### Task 4: Podium drawing (`lib/podium.ts`)

**Files:**
- Create: `lib/podium.ts`, `lib/podium.test.ts`, `components/office/MonthPodium.tsx`

**Interfaces:**
- Consumes: `spriteRects`, `OUTLINE`, `HEAD_BOX`, `Rect` from `lib/sprite.ts`.
- Produces:
```ts
export const PODIUM_W = 68
export const PODIUM_H = 54
/** Background, frame and blocks. */
export function podiumRects(): Rect[]
/** Where each place's head goes: [gold, silver, bronze] top-left in podium units. */
export const PODIUM_HEADS: readonly [{ x: 25; y: 8 }, { x: 5; y: 14 }, { x: 45; y: 18 }]
```
  and `MonthPodium({ top, scale, className }: { top: (Figure | null)[]; scale: number; className?: string })` rendering one `<svg viewBox="0 0 68 54">` with `podiumRects()` and, per filled place, a nested `<svg x y width={HEAD_BOX.w} height={HEAD_BOX.h} viewBox={HEAD_VIEWBOX}>` of `spriteRects(fig, { pose: 'stand', crown: place === 0 })`.

- [ ] **Step 1: Write the failing tests:** `podiumRects stays inside 68×54`; `the outline frame is the first rect` (`{x:0,y:0,w:68,h:54,fill:OUTLINE}`); `blocks match the spec` (silver top y 35, gold y 29, bronze y 39 at x 4/24/44, widths 21).
- [ ] **Step 2:** Run `npx vitest run lib/podium.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement from the spec table (colours: sky `#9fd2ff`/`#8fc4ff`, grass `#9ab78f` from y 40 with `#86a37c` top line, wood `#8a5a36`/`#a8703f`, silver `#cfd6e6`, gold `#ffd166`, bronze `#e0995a`, each block with a lighter top band and a darker number mark; the sketch's exact rects are in `podium()` in the artifact's page source if needed — read it with the Artifact tool, `action: "read"`). `MonthPodium` uses `shapeRendering="crispEdges"` and `aria-hidden`.
- [ ] **Step 4:** Run the tests. Expected: PASS.
- [ ] **Step 5:** Commit `Podium: the pixel winner's podium`.

### Task 5: Data — `monthSeconds` in the snapshot and the `loadMonthBoard` action

**Files:**
- Modify: `lib/snapshot.ts` (+ `lib/snapshot.test.ts`), `lib/leaderboard.ts` (+ test), `lib/office.ts`, `lib/demo-office.ts`
- Create: `app/actions/month.ts`

**Interfaces:**
- Produces: `OfficeEmployee.monthSeconds: number`; `RankKey` gains `'monthSeconds'`.
- Produces: `loadMonthBoard(input: { monthStart: number }): Promise<MonthBoard & { firstMonthStart: number }>` (Server Action, `'use server'`, requires a logged-in non-archived employee, throws otherwise).

- [ ] **Step 1: Failing tests:** in `snapshot.test.ts`, `monthSeconds counts from the Oslo month start` (a round on the 1st at 00:10 counts; one ending 23:50 on the last day of the previous month does not); in `leaderboard.test.ts`, `rankBy works on monthSeconds`.
- [ ] **Step 2:** Run them. Expected: FAIL.
- [ ] **Step 3:** `buildSnapshot` adds `month += creditedSecondsBetween(s, now, osloMonthStart(now), dayEnd)`. `loadOfficeSnapshot` widens the sessions query to `gte(endedAt, new Date(Math.min(weekStart, monthStart)))`. Demo data gets plausible month totals.
- [ ] **Step 4:** `app/actions/month.ts`: `firstMonthStart = osloMonthStart(min(started_at))` (current month if no rounds); `monthStart = clampMonth(input.monthStart, …)`; load all employees (incl. archived) and sessions touching `[prevMonthStart, nextMonthStart)`; return `{ ...monthBoard(...), firstMonthStart }`.
- [ ] **Step 5:** `npx tsc --noEmit && npm test`. Expected: PASS.
- [ ] **Step 6:** Commit `Month seconds in the snapshot and a month board action`.

### Task 6: The podium on the wall and the panel

**Files:**
- Create: `components/office/MonthPanel.tsx`, `components/office/MonthBoardView.tsx`
- Modify: `components/office/OfficeRoom.tsx`, `components/office/OfficeRoom.module.css`, `components/OfficeApp.tsx` (pass `meId`), locales

**Interfaces:**
- Consumes: `MonthPodium`, `loadMonthBoard`, `rankBy(…, 'monthSeconds', …)`.
- Produces: `MonthBoardView({ meId, initialMonthStart }: …)` — the arrows, podium (3×), status, progress, list and foot; reused by Task 7.

- [ ] **Step 1:** `OfficeRoom` gets a `monthOpen` state next to `factOpen`; opening either, or a colleague's menu, closes the others (extend `toggle` and the poster's `onOpenChange`). Add a `.podium` wall prop: a box with the same `top`, `width: min(320px, 23%)` and `aspect-ratio: 64 / 36` as `.window`, placed at the right window's `left` + its width + 40 px, `display: flex; flex-direction: column; justify-content: center; align-items: flex-start`, containing the label (reuse the poster label style) and a button with `MonthPodium` at scale 1.5 showing the top three by `monthSeconds`. Hidden at ≤700 px. Login backdrop shows it too (demo data).
- [ ] **Step 2:** Narrow widths: `OfficeRoom` sets `--screens-w` on the room (`n * 84 + (n - 1) * 14` px for n wall screens, 0 when none). In CSS, `--wall-shift: max(0px, <podium right edge> - <limit>)` where podium right edge = `58% + clamp(0px, (100% - 760px) / 10, 20px) + min(320px, 23%) + 40px + 102px`, limit = `100% - max(2% + 48px + 16px, 30px + var(--screens-w) + 32px)`. Apply `translate: calc(-1 * var(--wall-shift)) 0` to both windows, `.poster`, `.clock` and `.podium` (`translate`, not `transform`: the clock already uses `transform`). Put these rules in a new block at the end of the file and re-assert phone overrides there (see the cascade trap in CLAUDE.md).
- [ ] **Step 3:** `MonthPanel` uses the `factPanel` pattern (dialog under the prop, opening downward/inside the room). `MonthBoardView` calls `loadMonthBoard` on open and on each arrow, caches finished months in a `Map` in state, shows `month.loading` while waiting. Copy (nb / en): `month.title` «Månedens ståere» / «Stander of the month»; `month.won` «{name} vant {month} med {hours}» / «{name} won {month} with {hours}»; `month.leading` «Pågår · {name} leder akkurat nå» / «Ongoing · {name} is leading»; `month.progress` «🚀 Mest framgang: {name}, +{hours} fra {prev}» / «🚀 Most improved: {name}, +{hours} on {prev}»; `month.progressSoFar` same + « så langt» / « so far»; `month.total` «Hele kontoret: {hours} stående» / «Whole office: {hours} standing»; `month.prev` / `month.next` aria labels; `month.empty` «Ingen sto denne måneden.» / «Nobody stood this month.»; `month.loading` «Henter …» / «Loading …». Month names via `Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'nb-NO', { month: 'long', year: 'numeric', timeZone: 'Europe/Oslo' })`. Hours via the existing `formatDuration`. Logged-in user's row in yellow (`meRow` style).
- [ ] **Step 4:** Verify visually on `/dev/room` (port 3107; port 3000 is another app): screenshot at 1920 and 1280 and compare with the approved sketch; then sweep `main.style.width` from 701 to 1920 in 20 px steps with 0, 1 and 2 wall screens (`/dev/room` demo data; add a second remote demo person temporarily if needed) and assert in the page that the podium's rect intersects neither `.screens`, the hanging plant, nor the right window. Show Andreas the screenshots.
- [ ] **Step 5:** `npx tsc --noEmit && npm run lint && npm test && npm run build`. Expected: all pass.
- [ ] **Step 6:** Commit `Månedens ståere: podium on the wall and a month panel`.

### Task 7: Phones — «Denne måneden» list and «Tidligere måneder»

**Files:**
- Modify: `components/Leaderboard.tsx`, `components/OfficeApp.module.css`, locales

- [ ] **Step 1:** Add `{ key: 'monthSeconds', title: 'board.month' }` to `BOARDS` (nb «Denne måneden», en «This month»), shown **only at ≤700 px** (the spec keeps the desktop leaderboard unchanged; desktop has the wall podium).
- [ ] **Step 2:** Under the month list, on phones only, a button `board.pastMonths` «Tidligere måneder» / «Past months» opening `MonthBoardView` in the `backdrop`/`dialog` pattern used by `StillStandingDialog`.
- [ ] **Step 3:** Verify at 390 px and 700 px: list collapses to 5 with «Vis alle», dialog fits without horizontal scroll, arrows work back to September 2026.
- [ ] **Step 4:** `npx tsc --noEmit && npm run lint && npm test && npm run build`. Commit `Month list and past months on phones`.

### Task 8: Docs and release

**Files:**
- Modify: `standing-challenge/CLAUDE.md`

- [ ] **Step 1:** Add «Månedens ståere» under Room features (wall prop, panel, progress rule, `--wall-shift`), archiving under Rules & conventions, `lib/month-board`/`lib/podium` under Structure, update the test count and the «Current status» line.
- [ ] **Step 2:** Final check: `npm test && npx tsc --noEmit && npm run lint && npm run build`.
- [ ] **Step 3:** Commit. **Stop here** and hand back to Andreas: deploy order is `npm run db:push:prod` (adds `archived_at`), then merge to `master`. Do not run either without his go-ahead.
